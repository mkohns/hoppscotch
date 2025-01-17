import { defineStore } from "pinia"
import { ref } from "vue"

export const useLoggerStore = defineStore("logger", () => {
  const logs = ref<Log[]>([])

  const addLog = async (obj: unknown) => {
    logs.value.push({
      timestamp: new Date(),
      message: obj,
    })
  }

  const addRequest = async (request: Request) => {
    logs.value.push({ timestamp: new Date(), request: request })
  }

  const addResponse = async (requestid: number, response: Response) => {
    for (let i = 0; i < logs.value.length; i++) {
      const logRequest = logs.value[i].request
      if (logRequest && logRequest.req_id === requestid) {
        logs.value[i].response = response
        break
      }
    }
  }

  const addResponseError = async (requestid: number, error: unknown) => {
    for (let i = 0; i < logs.value.length; i++) {
      const logRequest = logs.value[i].request
      if (logRequest && logRequest.req_id === requestid) {
        logs.value[i].error = error
        break
      }
    }
  }

  const removeLog = async (index: number) => {
    logs.value.splice(index, 1)
  }

  const clearLogs = async () => {
    logs.value.splice(0, logs.value.length)
  }

  return {
    logs,
    clearLogs,
    addLog,
    addRequest,
    addResponse,
    addResponseError,
    removeLog,
  }
})

export type KeyValuePair = {
  key: string
  value: string
}

export type BodyDef =
  | { Text: string }
  | { URLEncoded: KeyValuePair[] }
  | { FormData: FormDataEntry[] }

export type FormDataEntry = {
  key: string
  value: FormDataValue
}

export type FormDataValue =
  | { Text: string }
  | {
      File: {
        filename: string
        data: number[]
        mime: string
      }
    }

export interface Request {
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

export type ClientCertDef =
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

export interface Response {
  status: number
  status_text: string
  headers: KeyValuePair[]
  data: number[]

  time_start_ms: number
  time_end_ms: number
}

export interface Log {
  timestamp: Date
  request?: Request
  response?: Response
  message?: unknown
  error?: unknown
}
