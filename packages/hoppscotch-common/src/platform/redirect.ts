/**
 * Configuration options for the OAuth server.
 */
export interface OauthConfig {
  /**
   * An array of port numbers the server should try to bind to.
   * If not provided, the server will use a random available port.
   */
  ports?: number[]

  /**
   * Custom HTML response sent to the user after being redirected.
   * If not provided, a default response will be used.
   */
  response?: string
}

/**
 * Platform definitions for how to handle IO operations.
 */
export type RedirectPlatformDef = {
  start: (config?: OauthConfig) => Promise<number>
  cancel: (port: number) => Promise<void>
  onUrl: (callback: (url: string) => void) => Promise<() => void>
  onInvalidUrl: (callback: (error: string) => void) => Promise<() => void>
}
