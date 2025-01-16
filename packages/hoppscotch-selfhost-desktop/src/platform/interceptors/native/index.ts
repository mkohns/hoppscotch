import { CookieJarService } from "@hoppscotch/common/services/cookie-jar.service"
import {
  Interceptor,
  InterceptorError,
  RequestRunResult,
} from "@hoppscotch/common/services/interceptor.service"
import { Service } from "dioc"
import { cloneDeep } from "lodash-es"
import { invoke } from "@tauri-apps/api/tauri"
import * as E from "fp-ts/Either"
import SettingsNativeInterceptor from "../../../components/settings/NativeInterceptor.vue"
import { ref, watch } from "vue"
import { z } from "zod"
import { PersistenceService } from "@hoppscotch/common/services/persistence"
import {
  CACertStore,
  ClientCertsStore,
  ClientCertStore,
  StoredClientCert,
} from "./persisted-data"

type KeyValuePair = {
  key: string
  value: string
}

type FormDataValue =
  | { Text: string }
  | {
      File: {
        filename: string
        data: number[]
        mime: string
      }
    }

type FormDataEntry = {
  key: string
  value: FormDataValue
}

type BodyDef =
  | { Text: string }
  | { URLEncoded: KeyValuePair[] }
  | { FormData: FormDataEntry[] }

type ClientCertDef =
  | {
      PEMCert: {
        certificate_pem: number[]
        key_pem: number[]
      }
    }
  | {
      PFXCert: {
        certificate_pfx: number[]
        password: string
      }
    }

// TODO: Figure out a way to autogen this from the interceptor definition on the Rust side
export type RequestDef = {
  req_id: number

  method: string
  endpoint: string

  parameters: KeyValuePair[]
  headers: KeyValuePair[]

  body: BodyDef | null

  validate_certs: boolean
  root_cert_bundle_files: number[]
  client_cert: ClientCertDef | null

  proxy?: {
    url: string
  }
}

type RunRequestResponse = {
  status: number
  status_text: string
  headers: KeyValuePair[]
  data: number[]

  time_start_ms: number
  time_end_ms: number
}

// HACK: To solve the AxiosRequestConfig being different between @hoppscotch/common
// and the axios present in this package
type AxiosRequestConfig = Parameters<Interceptor["runRequest"]>[0]

export const preProcessRequest = (
  req: AxiosRequestConfig
): AxiosRequestConfig => {
  const reqClone = cloneDeep(req)

  // If the parameters are URLSearchParams, inject them to URL instead
  // This prevents issues of marshalling the URLSearchParams to the proxy
  if (reqClone.params instanceof URLSearchParams) {
    try {
      const url = new URL(reqClone.url ?? "")

      for (const [key, value] of reqClone.params.entries()) {
        url.searchParams.append(key, value)
      }

      reqClone.url = url.toString()
    } catch (e) {
      // making this a non-empty block, so we can make the linter happy.
      // we should probably use, allowEmptyCatch, or take the time to do something with the caught errors :)
    }

    reqClone.params = {}
  }

  return reqClone
}

async function processBody(
  axiosReq: AxiosRequestConfig
): Promise<BodyDef | null> {
  if (!axiosReq.data) return null

  if (typeof axiosReq.data === "string") {
    return { Text: axiosReq.data }
  }

  if (axiosReq.data instanceof FormData) {
    const entries: FormDataEntry[] = []

    for (const [key, value] of axiosReq.data.entries()) {
      if (typeof value === "string") {
        entries.push({
          key,
          value: { Text: value },
        })
      } else {
        const mime = value.type !== "" ? value.type : "application/octet-stream"

        entries.push({
          key,
          value: {
            File: {
              filename: value.name,
              data: Array.from(new Uint8Array(await value.arrayBuffer())),
              mime,
            },
          },
        })
      }
    }

    return { FormData: entries }
  }

  throw new Error("Native Process Body: Unhandled Axios Request Configuration")
}

function getURLDomain(url: string): string | null {
  try {
    return new URL(url).host
  } catch (_) {
    return null
  }
}

function convertClientCertToDefCert(
  cert: ClientCertificateEntry
): ClientCertDef {
  if ("PEMCert" in cert.cert) {
    return {
      PEMCert: {
        certificate_pem: Array.from(cert.cert.PEMCert.certificate_pem),
        key_pem: Array.from(cert.cert.PEMCert.key_pem),
      },
    }
  } else {
    return {
      PFXCert: {
        certificate_pfx: Array.from(cert.cert.PFXCert.certificate_pfx),
        password: cert.cert.PFXCert.password,
      },
    }
  }
}

async function convertToRequestDef(
  axiosReq: AxiosRequestConfig,
  reqID: number,
  caCertificates: CACertificateEntry[],
  clientCertificates: Map<string, ClientCertificateEntry>,
  validateCerts: boolean,
  proxyInfo: RequestDef["proxy"]
): Promise<RequestDef> {
  const clientCertDomain = getURLDomain(axiosReq.url!)

  const clientCert = clientCertDomain
    ? clientCertificates.get(clientCertDomain)
    : null

  return {
    req_id: reqID,
    method: axiosReq.method ?? "GET",
    endpoint: axiosReq.url ?? "",
    headers: Object.entries(axiosReq.headers ?? {})
      .filter(
        ([key, value]) =>
          !(
            key.toLowerCase() === "content-type" &&
            value.toLowerCase() === "multipart/form-data"
          )
      ) // Removing header, because this header will be set by relay.
      .map(([key, value]): KeyValuePair => ({ key, value })),
    parameters: Object.entries(
      (axiosReq.params as Record<string, string>) ?? {}
    ).map(([key, value]): KeyValuePair => ({ key, value })),
    body: await processBody(axiosReq),
    root_cert_bundle_files: caCertificates.map((cert) =>
      Array.from(cert.certificate)
    ),
    validate_certs: validateCerts,
    client_cert: clientCert ? convertClientCertToDefCert(clientCert) : null,
    proxy: proxyInfo,
  }
}

export const CACertificateEntry = z.object({
  filename: z.string().min(1),
  enabled: z.boolean(),
  certificate: z.instanceof(Uint8Array),
})

export type CACertificateEntry = z.infer<typeof CACertificateEntry>

export const ClientCertificateEntry = z.object({
  enabled: z.boolean(),
  domain: z.string().trim().min(1),
  cert: z.union([
    z.object({
      PEMCert: z.object({
        certificate_filename: z.string().min(1),
        certificate_pem: z.instanceof(Uint8Array),

        key_filename: z.string().min(1),
        key_pem: z.instanceof(Uint8Array),
      }),
    }),
    z.object({
      PFXCert: z.object({
        certificate_filename: z.string().min(1),
        certificate_pfx: z.instanceof(Uint8Array),

        password: z.string(),
      }),
    }),
  ]),
})

export type ClientCertificateEntry = z.infer<typeof ClientCertificateEntry>

const CA_STORE_PERSIST_KEY = "native_interceptor_ca_store"
const CLIENT_CERTS_PERSIST_KEY = "native_interceptor_client_certs_store"
const VALIDATE_SSL_KEY = "native_interceptor_validate_ssl"
const PROXY_USER_INFO_PERSIST_KEY = "native_interceptor_user_proxy_info"
const PROXY_ENABLED_PERSIST_KEY = "native_interceptor_proxy_enabled"

export class NativeInterceptorService extends Service implements Interceptor {
  public static readonly ID = "NATIVE_INTERCEPTOR_SERVICE"

  public interceptorID = "native"

  public name = () => "Native"

  public selectable = { type: "selectable" as const }

  public supportsCookies = true
  public supportsDigestAuth = true
  public supportsBinaryContentType = false

  private cookieJarService = this.bind(CookieJarService)
  private persistenceService: PersistenceService = this.bind(PersistenceService)

  private reqIDTicker = 0

  public settingsPageEntry = {
    entryTitle: () => "Native", // TODO: i18n this
    component: SettingsNativeInterceptor,
  }

  public caCertificates = ref<CACertificateEntry[]>([])

  public clientCertificates = ref<Map<string, ClientCertificateEntry>>(
    new Map()
  )
  public validateCerts = ref(true)
  public proxyInfo = ref<RequestDef["proxy"]>(undefined)
  public proxyUserInfo = ref<RequestDef["proxy"]>(undefined)
  public proxyEnabled = ref(true)

  override onServiceInit() {
    // Load SSL Validation
    const persistedValidateSSL: unknown = JSON.parse(
      this.persistenceService.getLocalConfig(VALIDATE_SSL_KEY) ?? "null"
    )

    if (typeof persistedValidateSSL === "boolean") {
      this.validateCerts.value = persistedValidateSSL
    }

    // make sure the default zscaler proxy is set
    const persistedDefaultProxyInfo = this.persistenceService.getLocalConfig(
      PROXY_USER_INFO_PERSIST_KEY
    )
    if (persistedDefaultProxyInfo === null) {
      // TODO make this configurable
      console.log("Initializing default proxy")
      this.proxyUserInfo.value = { url: "http://localhost:9000" }
      // persist the default proxy
      this.persistenceService.setLocalConfig(
        PROXY_USER_INFO_PERSIST_KEY,
        JSON.stringify(this.proxyUserInfo.value)
      )
    } else {
      try {
        const proxyInfo = JSON.parse(persistedDefaultProxyInfo)
        this.proxyUserInfo.value = proxyInfo
      } catch (e) {}
    }

    // make sure the proxy is enabled by default
    const persistedProxyEnabled = this.persistenceService.getLocalConfig(
      PROXY_ENABLED_PERSIST_KEY
    )
    if (persistedProxyEnabled === null) {
      console.log("Initializing default proxy enabled")
      this.proxyEnabled.value = true
      this.proxyInfo.value = this.proxyUserInfo.value
      // persist the default proxy enabled
      this.persistenceService.setLocalConfig(
        PROXY_ENABLED_PERSIST_KEY,
        JSON.stringify(this.proxyEnabled.value)
      )
    } else {
      try {
        this.proxyEnabled.value = JSON.parse(persistedProxyEnabled)
      } catch (e) {}
      if (this.proxyEnabled.value) {
        this.proxyInfo.value = this.proxyUserInfo.value
      }
    }

    watch(this.validateCerts, () => {
      this.persistenceService.setLocalConfig(
        VALIDATE_SSL_KEY,
        JSON.stringify(this.validateCerts.value)
      )
    })

    // Load and setup writes for CA Store
    const persistedCAStoreData = JSON.parse(
      this.persistenceService.getLocalConfig(CA_STORE_PERSIST_KEY) ?? "null"
    )

    const caStoreDataParseResult = CACertStore.safeParse(persistedCAStoreData)

    if (caStoreDataParseResult.type === "ok") {
      this.caCertificates.value = caStoreDataParseResult.value.certs.map(
        (entry) => ({
          ...entry,
          certificate: new Uint8Array(entry.certificate),
        })
      )
    }

    // make sure the zscaler root cert is set
    let found = false
    this.caCertificates.value.forEach((cert) => {
      if (cert.filename === "ZscalerRootCertificate-2048-SHA256.crt") {
        console.log("Zscaler root cert found")
        found = true
      }
    })
    if (!found) {
      // TODO make this configurable
      console.log("Zscaler root cert not found, adding it")
      this.caCertificates.value.push({
        filename: "ZscalerRootCertificate-2048-SHA256.crt",
        enabled: true,
        certificate: new Uint8Array([
          45, 45, 45, 45, 45, 66, 69, 71, 73, 78, 32, 67, 69, 82, 84, 73, 70,
          73, 67, 65, 84, 69, 45, 45, 45, 45, 45, 10, 77, 73, 73, 69, 48, 122,
          67, 67, 65, 55, 117, 103, 65, 119, 73, 66, 65, 103, 73, 74, 65, 78,
          117, 43, 109, 67, 50, 74, 116, 51, 117, 84, 77, 65, 48, 71, 67, 83,
          113, 71, 83, 73, 98, 51, 68, 81, 69, 66, 67, 119, 85, 65, 77, 73, 71,
          104, 77, 81, 115, 119, 67, 81, 89, 68, 10, 86, 81, 81, 71, 69, 119,
          74, 86, 85, 122, 69, 84, 77, 66, 69, 71, 65, 49, 85, 69, 67, 66, 77,
          75, 81, 50, 70, 115, 97, 87, 90, 118, 99, 109, 53, 112, 89, 84, 69,
          82, 77, 65, 56, 71, 65, 49, 85, 69, 66, 120, 77, 73, 85, 50, 70, 117,
          73, 69, 112, 118, 99, 50, 85, 120, 10, 70, 84, 65, 84, 66, 103, 78,
          86, 66, 65, 111, 84, 68, 70, 112, 122, 89, 50, 70, 115, 90, 88, 73,
          103, 83, 87, 53, 106, 76, 106, 69, 86, 77, 66, 77, 71, 65, 49, 85, 69,
          67, 120, 77, 77, 87, 110, 78, 106, 89, 87, 120, 108, 99, 105, 66, 74,
          98, 109, 77, 117, 77, 82, 103, 119, 10, 70, 103, 89, 68, 86, 81, 81,
          68, 69, 119, 57, 97, 99, 50, 78, 104, 98, 71, 86, 121, 73, 70, 74,
          118, 98, 51, 81, 103, 81, 48, 69, 120, 73, 106, 65, 103, 66, 103, 107,
          113, 104, 107, 105, 71, 57, 119, 48, 66, 67, 81, 69, 87, 69, 51, 78,
          49, 99, 72, 66, 118, 99, 110, 82, 65, 10, 101, 110, 78, 106, 89, 87,
          120, 108, 99, 105, 53, 106, 98, 50, 48, 119, 72, 104, 99, 78, 77, 84,
          81, 120, 77, 106, 69, 53, 77, 68, 65, 121, 78, 122, 85, 49, 87, 104,
          99, 78, 78, 68, 73, 119, 78, 84, 65, 50, 77, 68, 65, 121, 78, 122, 85,
          49, 87, 106, 67, 66, 111, 84, 69, 76, 10, 77, 65, 107, 71, 65, 49, 85,
          69, 66, 104, 77, 67, 86, 86, 77, 120, 69, 122, 65, 82, 66, 103, 78,
          86, 66, 65, 103, 84, 67, 107, 78, 104, 98, 71, 108, 109, 98, 51, 74,
          117, 97, 87, 69, 120, 69, 84, 65, 80, 66, 103, 78, 86, 66, 65, 99, 84,
          67, 70, 78, 104, 98, 105, 66, 75, 10, 98, 51, 78, 108, 77, 82, 85,
          119, 69, 119, 89, 68, 86, 81, 81, 75, 69, 119, 120, 97, 99, 50, 78,
          104, 98, 71, 86, 121, 73, 69, 108, 117, 89, 121, 52, 120, 70, 84, 65,
          84, 66, 103, 78, 86, 66, 65, 115, 84, 68, 70, 112, 122, 89, 50, 70,
          115, 90, 88, 73, 103, 83, 87, 53, 106, 10, 76, 106, 69, 89, 77, 66,
          89, 71, 65, 49, 85, 69, 65, 120, 77, 80, 87, 110, 78, 106, 89, 87,
          120, 108, 99, 105, 66, 83, 98, 50, 57, 48, 73, 69, 78, 66, 77, 83, 73,
          119, 73, 65, 89, 74, 75, 111, 90, 73, 104, 118, 99, 78, 65, 81, 107,
          66, 70, 104, 78, 122, 100, 88, 66, 119, 10, 98, 51, 74, 48, 81, 72,
          112, 122, 89, 50, 70, 115, 90, 88, 73, 117, 89, 50, 57, 116, 77, 73,
          73, 66, 73, 106, 65, 78, 66, 103, 107, 113, 104, 107, 105, 71, 57,
          119, 48, 66, 65, 81, 69, 70, 65, 65, 79, 67, 65, 81, 56, 65, 77, 73,
          73, 66, 67, 103, 75, 67, 65, 81, 69, 65, 10, 113, 84, 55, 83, 84, 83,
          120, 90, 82, 84, 103, 69, 70, 70, 102, 54, 100, 111, 72, 97, 106, 83,
          99, 49, 118, 107, 53, 106, 109, 122, 109, 77, 54, 66, 87, 117, 79,
          111, 48, 52, 52, 69, 115, 97, 84, 99, 57, 101, 86, 69, 86, 47, 72,
          106, 72, 47, 49, 68, 87, 122, 90, 116, 99, 114, 10, 102, 84, 106, 43,
          110, 105, 50, 48, 53, 97, 112, 77, 84, 108, 75, 66, 87, 51, 85, 89,
          82, 43, 108, 121, 76, 72, 81, 57, 70, 111, 90, 105, 68, 88, 89, 88,
          75, 56, 112, 111, 75, 83, 86, 53, 43, 84, 109, 48, 86, 108, 115, 47,
          53, 75, 98, 56, 109, 107, 104, 86, 86, 113, 118, 55, 10, 76, 103, 89,
          69, 109, 118, 69, 89, 55, 72, 80, 89, 43, 105, 49, 110, 69, 71, 90,
          67, 97, 52, 54, 90, 88, 67, 79, 111, 104, 74, 48, 109, 66, 69, 116,
          66, 57, 74, 86, 108, 112, 68, 73, 79, 43, 110, 78, 48, 104, 85, 77,
          65, 89, 89, 100, 90, 49, 75, 90, 87, 67, 77, 78, 102, 10, 53, 74, 47,
          97, 84, 90, 105, 83, 104, 115, 111, 114, 78, 50, 65, 51, 56, 105, 83,
          79, 104, 100, 100, 43, 109, 99, 82, 77, 52, 105, 78, 76, 51, 103, 115,
          76, 117, 57, 57, 88, 104, 75, 110, 82, 113, 75, 111, 72, 101, 72, 56,
          51, 108, 86, 100, 102, 117, 49, 88, 66, 101, 111, 81, 122, 10, 122,
          53, 86, 54, 103, 65, 51, 107, 98, 82, 118, 104, 68, 119, 111, 73, 108,
          84, 66, 101, 77, 97, 53, 108, 52, 121, 82, 100, 74, 65, 102, 100, 112,
          107, 98, 70, 122, 113, 105, 119, 83, 103, 78, 100, 104, 98, 120, 84,
          72, 110, 89, 89, 111, 114, 68, 122, 75, 102, 114, 50, 114, 69, 70, 77,
          10, 100, 115, 77, 85, 48, 68, 72, 100, 101, 65, 90, 102, 55, 49, 49,
          43, 49, 67, 117, 110, 117, 81, 73, 68, 65, 81, 65, 66, 111, 52, 73,
          66, 67, 106, 67, 67, 65, 81, 89, 119, 72, 81, 89, 68, 86, 82, 48, 79,
          66, 66, 89, 69, 70, 76, 109, 51, 51, 85, 114, 78, 119, 119, 52, 77,
          10, 104, 112, 49, 100, 51, 43, 119, 99, 66, 71, 110, 70, 84, 112, 106,
          102, 77, 73, 72, 87, 66, 103, 78, 86, 72, 83, 77, 69, 103, 99, 52,
          119, 103, 99, 117, 65, 70, 76, 109, 51, 51, 85, 114, 78, 119, 119, 52,
          77, 104, 112, 49, 100, 51, 43, 119, 99, 66, 71, 110, 70, 84, 112, 106,
          102, 10, 111, 89, 71, 110, 112, 73, 71, 107, 77, 73, 71, 104, 77, 81,
          115, 119, 67, 81, 89, 68, 86, 81, 81, 71, 69, 119, 74, 86, 85, 122,
          69, 84, 77, 66, 69, 71, 65, 49, 85, 69, 67, 66, 77, 75, 81, 50, 70,
          115, 97, 87, 90, 118, 99, 109, 53, 112, 89, 84, 69, 82, 77, 65, 56,
          71, 10, 65, 49, 85, 69, 66, 120, 77, 73, 85, 50, 70, 117, 73, 69, 112,
          118, 99, 50, 85, 120, 70, 84, 65, 84, 66, 103, 78, 86, 66, 65, 111,
          84, 68, 70, 112, 122, 89, 50, 70, 115, 90, 88, 73, 103, 83, 87, 53,
          106, 76, 106, 69, 86, 77, 66, 77, 71, 65, 49, 85, 69, 67, 120, 77, 77,
          10, 87, 110, 78, 106, 89, 87, 120, 108, 99, 105, 66, 74, 98, 109, 77,
          117, 77, 82, 103, 119, 70, 103, 89, 68, 86, 81, 81, 68, 69, 119, 57,
          97, 99, 50, 78, 104, 98, 71, 86, 121, 73, 70, 74, 118, 98, 51, 81,
          103, 81, 48, 69, 120, 73, 106, 65, 103, 66, 103, 107, 113, 104, 107,
          105, 71, 10, 57, 119, 48, 66, 67, 81, 69, 87, 69, 51, 78, 49, 99, 72,
          66, 118, 99, 110, 82, 65, 101, 110, 78, 106, 89, 87, 120, 108, 99,
          105, 53, 106, 98, 50, 50, 67, 67, 81, 68, 98, 118, 112, 103, 116, 105,
          98, 100, 55, 107, 122, 65, 77, 66, 103, 78, 86, 72, 82, 77, 69, 66,
          84, 65, 68, 10, 65, 81, 72, 47, 77, 65, 48, 71, 67, 83, 113, 71, 83,
          73, 98, 51, 68, 81, 69, 66, 67, 119, 85, 65, 65, 52, 73, 66, 65, 81,
          65, 119, 48, 78, 100, 74, 104, 56, 119, 51, 78, 115, 74, 117, 52, 75,
          72, 117, 86, 90, 85, 114, 109, 90, 103, 73, 111, 104, 110, 84, 109,
          48, 106, 43, 10, 82, 84, 109, 89, 81, 57, 73, 75, 65, 47, 112, 118,
          120, 65, 99, 65, 54, 75, 49, 105, 47, 76, 79, 43, 66, 116, 43, 116,
          67, 88, 43, 67, 48, 121, 120, 113, 66, 56, 113, 122, 117, 111, 43, 52,
          118, 65, 122, 111, 89, 53, 74, 69, 66, 104, 121, 104, 66, 104, 102,
          49, 117, 75, 43, 80, 10, 47, 87, 86, 87, 70, 90, 78, 47, 43, 104, 84,
          103, 112, 83, 98, 90, 103, 122, 85, 69, 110, 87, 81, 71, 50, 103, 79,
          86, 100, 50, 52, 109, 115, 101, 120, 43, 48, 83, 114, 55, 104, 121,
          114, 57, 118, 110, 54, 79, 117, 101, 72, 43, 106, 106, 43, 118, 67,
          77, 105, 65, 109, 53, 43, 117, 10, 107, 100, 55, 108, 76, 118, 74,
          115, 66, 117, 51, 65, 79, 51, 106, 71, 87, 86, 76, 121, 80, 107, 83,
          51, 105, 54, 71, 102, 43, 114, 119, 65, 112, 49, 79, 115, 82, 114,
          118, 51, 87, 110, 98, 107, 89, 99, 70, 102, 57, 120, 106, 117, 97,
          102, 52, 122, 48, 104, 82, 67, 114, 76, 78, 50, 10, 120, 70, 78, 106,
          97, 118, 120, 114, 72, 109, 115, 72, 56, 106, 80, 72, 86, 118, 103,
          99, 49, 86, 68, 48, 79, 112, 106, 97, 48, 108, 47, 66, 82, 86, 97,
          117, 84, 114, 85, 97, 111, 87, 54, 116, 69, 43, 119, 70, 71, 53, 114,
          69, 99, 80, 71, 83, 56, 48, 106, 106, 72, 75, 52, 83, 10, 112, 66, 53,
          105, 68, 106, 50, 109, 85, 90, 72, 49, 84, 56, 108, 122, 89, 116, 117,
          90, 121, 48, 90, 80, 105, 114, 120, 109, 116, 115, 107, 51, 49, 51,
          53, 43, 67, 75, 78, 97, 50, 79, 67, 65, 104, 104, 70, 106, 69, 48,
          120, 100, 10, 45, 45, 45, 45, 45, 69, 78, 68, 32, 67, 69, 82, 84, 73,
          70, 73, 67, 65, 84, 69, 45, 45, 45, 45, 45, 10,
        ]),
      })
      const storableValue: CACertStore = {
        v: 1,
        certs: this.caCertificates.value.map((el) => ({
          ...el,
          certificate: Array.from(el.certificate),
        })),
      }

      this.persistenceService.setLocalConfig(
        CA_STORE_PERSIST_KEY,
        JSON.stringify(storableValue)
      )
    }

    watch(this.caCertificates, (certs) => {
      const storableValue: CACertStore = {
        v: 1,
        certs: certs.map((el) => ({
          ...el,
          certificate: Array.from(el.certificate),
        })),
      }

      this.persistenceService.setLocalConfig(
        CA_STORE_PERSIST_KEY,
        JSON.stringify(storableValue)
      )
    })

    // Load and setup writes for Client Certs Store
    const persistedClientCertStoreData = JSON.parse(
      this.persistenceService.getLocalConfig(CLIENT_CERTS_PERSIST_KEY) ?? "null"
    )

    const clientCertStoreDataParseResult = ClientCertsStore.safeParse(
      persistedClientCertStoreData
    )

    if (clientCertStoreDataParseResult.type === "ok") {
      this.clientCertificates.value = new Map(
        Object.entries(clientCertStoreDataParseResult.value.clientCerts).map(
          ([domain, cert]) => {
            if ("PFXCert" in cert.cert) {
              const newCert = <ClientCertificateEntry>{
                ...cert,
                cert: {
                  PFXCert: {
                    certificate_pfx: new Uint8Array(
                      cert.cert.PFXCert.certificate_pfx
                    ),
                    certificate_filename:
                      cert.cert.PFXCert.certificate_filename,

                    password: cert.cert.PFXCert.password,
                  },
                },
              }

              return [domain, newCert]
            } else {
              const newCert = <ClientCertificateEntry>{
                ...cert,
                cert: {
                  PEMCert: {
                    certificate_pem: new Uint8Array(
                      cert.cert.PEMCert.certificate_pem
                    ),
                    certificate_filename:
                      cert.cert.PEMCert.certificate_filename,

                    key_pem: new Uint8Array(cert.cert.PEMCert.key_pem),
                    key_filename: cert.cert.PEMCert.key_filename,
                  },
                },
              }

              return [domain, newCert]
            }
          }
        )
      )
    }

    watch(this.clientCertificates, (certs) => {
      const storableValue: ClientCertStore = {
        v: 1,
        clientCerts: Object.fromEntries(
          Array.from(certs.entries()).map(([domain, cert]) => {
            if ("PFXCert" in cert.cert) {
              const newCert = <StoredClientCert>{
                ...cert,
                cert: {
                  PFXCert: {
                    certificate_pfx: Array.from(
                      cert.cert.PFXCert.certificate_pfx
                    ),
                    certificate_filename:
                      cert.cert.PFXCert.certificate_filename,

                    password: cert.cert.PFXCert.password,
                  },
                },
              }

              return [domain, newCert]
            } else {
              const newCert = <StoredClientCert>{
                ...cert,
                cert: {
                  PEMCert: {
                    certificate_pem: Array.from(
                      cert.cert.PEMCert.certificate_pem
                    ),
                    certificate_filename:
                      cert.cert.PEMCert.certificate_filename,

                    key_pem: Array.from(cert.cert.PEMCert.key_pem),
                    key_filename: cert.cert.PEMCert.key_filename,
                  },
                },
              }

              return [domain, newCert]
            }
          })
        ),
      }

      this.persistenceService.setLocalConfig(
        CLIENT_CERTS_PERSIST_KEY,
        JSON.stringify(storableValue)
      )
    })

    watch(this.proxyUserInfo, (newProxyInfo) => {
      console.log("Setting new user proxy info: ", newProxyInfo)
      this.persistenceService.setLocalConfig(
        PROXY_USER_INFO_PERSIST_KEY,
        JSON.stringify(newProxyInfo) ?? "null"
      )
    })

    watch(this.proxyEnabled, (proxyEnabled) => {
      if (proxyEnabled) {
        console.log("Setting proxy info")
        this.proxyInfo.value = this.proxyUserInfo.value
      } else {
        console.log("Clearing proxy info")
        this.proxyInfo.value = undefined
      }
      this.persistenceService.setLocalConfig(
        PROXY_ENABLED_PERSIST_KEY,
        JSON.stringify(proxyEnabled) ?? "null"
      )
    })
  }

  public runRequest(
    req: AxiosRequestConfig
  ): RequestRunResult<InterceptorError> {
    const processedReq = preProcessRequest(req)

    const relevantCookies = this.cookieJarService.getCookiesForURL(
      new URL(processedReq.url!)
    )

    if (relevantCookies.length > 0) {
      processedReq.headers["Cookie"] = relevantCookies
        .map((cookie) => `${cookie.name!}=${cookie.value!}`)
        .join(";")
    }

    const reqID = this.reqIDTicker++

    return {
      cancel: () => {
        invoke("plugin:hopp_native_interceptor|cancel_request", {
          reqId: reqID,
        })
      },
      response: (async () => {
        const requestDef = await convertToRequestDef(
          processedReq,
          reqID,
          this.caCertificates.value,
          this.clientCertificates.value,
          this.validateCerts.value,
          this.proxyInfo.value
        )

        try {
          console.log("native Interceptor request:", requestDef)
          // TODO: add this to a pinia store

          const response: RunRequestResponse = await invoke(
            "plugin:hopp_native_interceptor|run_request",
            { req: requestDef }
          )

          console.log("native Interceptor response:", response)
          // TODO: add this to a pinia store

          return E.right({
            headers: Object.fromEntries(
              response.headers.map(({ key, value }) => [key, value])
            ),
            status: response.status,
            statusText: response.status_text,
            data: new Uint8Array(response.data).buffer,
            config: {
              timeData: {
                startTime: response.time_start_ms,
                endTime: response.time_end_ms,
              },
            },
            additional: {
              multiHeaders: response.headers,
            },
          })
        } catch (e) {
          console.log(e)

          if (typeof e === "object" && (e as any)["RequestCancelled"]) {
            return E.left("cancellation" as const)
          }

          // TODO: More in-depth error messages
          return E.left(<InterceptorError>{
            humanMessage: {
              heading: (t) => t("error.network_fail"),
              description: (t) => t("helpers.network_fail"),
            },
          })
        }
      })(),
    }
  }
}
