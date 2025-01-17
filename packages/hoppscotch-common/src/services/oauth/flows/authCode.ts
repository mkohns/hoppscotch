import { PersistenceService } from "~/services/persistence"
import {
  PersistedOAuthConfig,
  createFlowConfig,
  decodeResponseAsJSON,
  generateRandomString,
} from "../oauth.service"
import { z } from "zod"
import { getService } from "~/modules/dioc"
import * as E from "fp-ts/Either"
import { InterceptorService } from "~/services/interceptor.service"
import { AuthCodeGrantTypeParams } from "@hoppscotch/data"
import { platform } from "~/platform"
import { html } from "./authCode-redirect-page"
import { Router } from "vue-router"
import { getPortFromUrl } from "~/helpers/oauth"
import { useLoggerStore } from "~/stores/logger"
import { rand } from "@vueuse/core"

const persistenceService = getService(PersistenceService)
const interceptorService = getService(InterceptorService)

const { addRequest } = useLoggerStore()

const AuthCodeOauthFlowParamsSchema = AuthCodeGrantTypeParams.pick({
  authEndpoint: true,
  tokenEndpoint: true,
  clientID: true,
  clientSecret: true,
  scopes: true,
  isPKCE: true,
  codeVerifierMethod: true,
})
  .refine(
    (params) => {
      return (
        params.authEndpoint.length >= 1 &&
        params.tokenEndpoint.length >= 1 &&
        params.clientID.length >= 1 &&
        (!params.scopes || params.scopes.trim().length >= 1)
      )
    },
    {
      message: "Minimum length requirement not met for one or more parameters",
    }
  )
  .refine((params) => (params.isPKCE ? !!params.codeVerifierMethod : true), {
    message: "codeVerifierMethod is required when using PKCE",
    path: ["codeVerifierMethod"],
  })

export type AuthCodeOauthFlowParams = z.infer<
  typeof AuthCodeOauthFlowParamsSchema
>

export type AuthCodeOauthRefreshParams = {
  tokenEndpoint: string
  clientID: string
  clientSecret?: string
  refreshToken: string
}

export const getDefaultAuthCodeOauthFlowParams =
  (): AuthCodeOauthFlowParams => ({
    authEndpoint: "",
    tokenEndpoint: "",
    clientID: "",
    clientSecret: "",
    scopes: undefined,
    isPKCE: false,
    codeVerifierMethod: "S256",
  })

const initAuthCodeOauthFlow = async (
  {
    tokenEndpoint,
    clientID,
    clientSecret,
    scopes,
    authEndpoint,
    isPKCE,
    codeVerifierMethod,
  }: AuthCodeOauthFlowParams,
  router?: Router
) => {
  console.log("initAuthCodeOauthFlow: tokenEndpoint", tokenEndpoint)
  console.log("initAuthCodeOauthFlow: clientID", clientID)
  console.log("initAuthCodeOauthFlow: clientSecret", clientSecret)
  console.log("initAuthCodeOauthFlow: scopes", scopes)
  console.log("initAuthCodeOauthFlow: authEndpoint", authEndpoint)
  console.log("initAuthCodeOauthFlow: isPKCE", isPKCE)
  console.log("initAuthCodeOauthFlow: codeVerifierMethod", codeVerifierMethod)

  const state = generateRandomString()

  let codeVerifier: string | undefined
  let codeChallenge: string | undefined

  if (isPKCE) {
    codeVerifier = generateCodeVerifier()
    codeChallenge = await generateCodeChallenge(
      codeVerifier,
      codeVerifierMethod
    )
  }

  let oauthTempConfig: {
    state: string
    grant_type: "AUTHORIZATION_CODE"
    authEndpoint: string
    tokenEndpoint: string
    clientSecret?: string
    clientID: string
    isPKCE: boolean
    codeVerifier?: string
    codeVerifierMethod?: string
    codeChallenge?: string
    scopes?: string
  } = {
    state,
    grant_type: "AUTHORIZATION_CODE",
    authEndpoint,
    tokenEndpoint,
    clientSecret,
    clientID,
    isPKCE,
    codeVerifierMethod,
    scopes,
  }

  if (codeVerifier && codeChallenge) {
    oauthTempConfig = {
      ...oauthTempConfig,
      codeVerifier,
      codeChallenge,
    }
  }

  console.log("oauthTempConfig: ", oauthTempConfig)

  const localOAuthTempConfig =
    persistenceService.getLocalConfig("oauth_temp_config")

  const persistedOAuthConfig: PersistedOAuthConfig = localOAuthTempConfig
    ? { ...JSON.parse(localOAuthTempConfig) }
    : {}

  console.log("persistedOAuthConfig: ", persistedOAuthConfig)

  const { grant_type, ...rest } = oauthTempConfig

  // persist the state so we can compare it when we get redirected back
  // also persist the grant_type,tokenEndpoint and clientSecret so we can use them when we get redirected back
  persistenceService.setLocalConfig(
    "oauth_temp_config",
    JSON.stringify(<PersistedOAuthConfig>{
      ...persistedOAuthConfig,
      fields: rest,
      grant_type,
    })
  )

  let url: URL

  try {
    url = new URL(authEndpoint)
  } catch (e) {
    return E.left("INVALID_AUTH_ENDPOINT")
  }

  const redirectURL = import.meta.env.VITE_POSTBOY_OAUTH_REDIRECT_URL

  url.searchParams.set("grant_type", "authorization_code")
  url.searchParams.set("client_id", clientID)
  url.searchParams.set("state", state)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("redirect_uri", redirectURL)

  if (scopes) url.searchParams.set("scope", scopes)

  if (codeVerifierMethod && codeChallenge) {
    url.searchParams.set("code_challenge", codeChallenge)
    url.searchParams.set("code_challenge_method", codeVerifierMethod)
  }

  // Okay ready now, open the redirect server
  const redirectPort = getPortFromUrl(
    import.meta.env.VITE_POSTBOY_OAUTH_REDIRECT_URL
  )

  await platform.redirect.cancel(redirectPort).catch((error) => {
    console.log("Could not cancel server: ", error)
  })

  await platform.redirect.start({
    ports: [redirectPort],
    response: html.replaceAll(
      "VITE_BACKEND_API_URL",
      import.meta.env.VITE_BACKEND_API_URL
    ),
  })

  const req_id = rand(1, 100000)

  const unlisten = await platform.redirect.onUrl((url) => {
    console.log("Received OAuth URL:", url)
    console.log("Expected URL:", redirectURL)
    if (!url.startsWith(redirectURL)) {
      console.log("Ignoring URL")
      unlisten()
      return
    }
    // Process the OAuth URL...
    console.log("Unlisten:", unlisten)
    unlisten()
    addRequest({
      method: "GET",
      endpoint: url.toString(),
      parameters: [],
      headers: [],
      body: null,
      validate_certs: true,
      client_cert: null,
      req_id: req_id,
      root_cert_bundle_files: [],
    })
    const reload = url.replace(redirectURL, "/oauth")
    console.log("Reload:", reload)
    if (router) router.push(reload)
    else window.location.href = reload
  })

  //Redirect to the authorization server
  //window.location.assign(url.toString())
  addRequest({
    method: "GET",
    endpoint: url.toString(),
    parameters: [],
    headers: [],
    body: null,
    validate_certs: true,
    client_cert: null,
    req_id: req_id,
    root_cert_bundle_files: [],
  })
  platform.io.openExternalLink(url.toString())

  return E.right(undefined)
}

const handleRedirectForAuthCodeOauthFlow = async (localConfig: string) => {
  // parse the query string
  const params = new URLSearchParams(window.location.search)

  const code = params.get("code")
  const state = params.get("state")
  const error = params.get("error")

  console.log("handleRedirectForAuthCodeOauthFlow, code: ", code)
  console.log("handleRedirectForAuthCodeOauthFlow, state: ", state)
  console.log("handleRedirectForAuthCodeOauthFlow, error: ", error)

  if (error) {
    return E.left("AUTH_SERVER_RETURNED_ERROR")
  }

  if (!code) {
    return E.left("AUTH_TOKEN_REQUEST_FAILED")
  }

  const expectedSchema = z.object({
    source: z.optional(z.string()),
    state: z.string(),
    tokenEndpoint: z.string(),
    clientSecret: z.string(),
    clientID: z.string(),
    codeVerifier: z.string().optional(),
    codeChallenge: z.string().optional(),
  })

  const decodedLocalConfig = expectedSchema.safeParse(
    JSON.parse(localConfig).fields
  )

  if (!decodedLocalConfig.success) {
    return E.left("INVALID_LOCAL_CONFIG")
  }

  console.log("decodedLocalConfig: ", decodedLocalConfig)

  // check if the state matches
  if (decodedLocalConfig.data.state !== state) {
    return E.left("INVALID_STATE")
  }

  console.log("State matches")

  const redirectURL = import.meta.env.VITE_POSTBOY_OAUTH_REDIRECT_URL
  // exchange the code for a token
  const formData = new URLSearchParams()
  formData.append("grant_type", "authorization_code")
  formData.append("code", code)
  formData.append("client_id", decodedLocalConfig.data.clientID)
  formData.append("client_secret", decodedLocalConfig.data.clientSecret)
  formData.append("redirect_uri", redirectURL)

  if (decodedLocalConfig.data.codeVerifier) {
    formData.append("code_verifier", decodedLocalConfig.data.codeVerifier)
  }

  const { response } = interceptorService.runRequest({
    url: decodedLocalConfig.data.tokenEndpoint,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    data: formData.toString(),
  })

  const res = await response

  console.log("Token response: ", res)

  if (E.isLeft(res)) {
    return E.left("AUTH_TOKEN_REQUEST_FAILED" as const)
  }

  const responsePayload = decodeResponseAsJSON(res.right)

  console.log("Token responsePayload: ", responsePayload)

  if (E.isLeft(responsePayload)) {
    return E.left("AUTH_TOKEN_REQUEST_FAILED" as const)
  }

  const withAccessTokenSchema = z.object({
    access_token: z.string(),
    refresh_token: z.string().optional(),
  })

  const parsedTokenResponse = withAccessTokenSchema.safeParse(
    responsePayload.right
  )

  return parsedTokenResponse.success
    ? E.right(parsedTokenResponse.data)
    : E.left("AUTH_TOKEN_REQUEST_INVALID_RESPONSE" as const)
}

const generateCodeVerifier = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  const length = Math.floor(Math.random() * (128 - 43 + 1)) + 43 // Random length between 43 and 128
  let codeVerifier = ""

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    codeVerifier += characters[randomIndex]
  }

  return codeVerifier
}

const generateCodeChallenge = async (
  codeVerifier: string,
  strategy: AuthCodeOauthFlowParams["codeVerifierMethod"]
) => {
  if (strategy === "plain") {
    return codeVerifier
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)

  const buffer = await crypto.subtle.digest("SHA-256", data)

  return encodeArrayBufferAsUrlEncodedBase64(buffer)
}

const encodeArrayBufferAsUrlEncodedBase64 = (buffer: ArrayBuffer) => {
  const hashArray = Array.from(new Uint8Array(buffer))
  const hashBase64URL = btoa(String.fromCharCode(...hashArray))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")

  return hashBase64URL
}

const refreshToken = async ({
  tokenEndpoint,
  clientID,
  refreshToken,
  clientSecret,
}: AuthCodeOauthRefreshParams) => {
  const formData = new URLSearchParams()
  formData.append("grant_type", "refresh_token")
  formData.append("refresh_token", refreshToken)
  formData.append("client_id", clientID)
  if (clientSecret) {
    formData.append("client_secret", clientSecret)
  }

  const { response } = interceptorService.runRequest({
    url: tokenEndpoint,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    data: formData.toString(),
  })

  const res = await response

  if (E.isLeft(res)) {
    return E.left("AUTH_TOKEN_REQUEST_FAILED" as const)
  }

  const responsePayload = decodeResponseAsJSON(res.right)

  if (E.isLeft(responsePayload)) {
    return E.left("AUTH_TOKEN_REQUEST_FAILED" as const)
  }

  const withAccessTokenAndRefreshTokenSchema = z.object({
    access_token: z.string(),
    refresh_token: z.string().optional(),
  })

  const parsedTokenResponse = withAccessTokenAndRefreshTokenSchema.safeParse(
    responsePayload.right
  )

  return parsedTokenResponse.success
    ? E.right(parsedTokenResponse.data)
    : E.left("AUTH_TOKEN_REQUEST_INVALID_RESPONSE" as const)
}

export default createFlowConfig(
  "AUTHORIZATION_CODE" as const,
  AuthCodeOauthFlowParamsSchema,
  initAuthCodeOauthFlow,
  handleRedirectForAuthCodeOauthFlow,
  refreshToken
)
