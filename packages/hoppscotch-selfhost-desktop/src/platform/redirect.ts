import { invoke } from "@tauri-apps/api/tauri"
import { Event, listen } from "@tauri-apps/api/event"
import {
  OauthConfig,
  RedirectPlatformDef,
} from "@hoppscotch/common/platform/redirect"

export const def: RedirectPlatformDef = {
  /**
   * Starts the OAuth server.
   * @param config - Optional configuration for the server.
   * @returns A promise that resolves with the port number the server is listening on.
   * @example
   * ```typescript
   * import { start } from '@fabianlars/tauri-plugin-oauth';
   *
   * const port = await start({ ports: [8000, 8001] });
   * console.log(`OAuth server started on port ${port}`);
   * ```
   */
  async start(config?: OauthConfig): Promise<number> {
    return await invoke<number>("plugin:oauth|start", { config })
  },

  /**
   * Stops the OAuth server running on the specified port.
   * @param port - The port number of the server to stop.
   * @returns A promise that resolves when the server has been stopped.
   * @example
   * ```typescript
   * import { cancel } from '@fabianlars/tauri-plugin-oauth';
   *
   * await cancel(8000);
   * console.log('OAuth server stopped');
   * ```
   */
  async cancel(port: number): Promise<void> {
    await invoke<void>("plugin:oauth|cancel", { port })
  },

  /**
   * Listens for valid OAuth URLs.
   * @param callback - Function to be called when a valid URL is received.
   * @returns A promise that resolves with a function to remove the event listener.
   * @example
   * ```typescript
   * import { onUrl } from '@fabianlars/tauri-plugin-oauth';
   *
   * const unlisten = await onUrl((url) => {
   *   console.log('Received OAuth URL:', url);
   *   // Process the OAuth URL...
   * });
   *
   * // Later, to stop listening:
   * unlisten();
   * ```
   */
  onUrl(callback: (url: string) => void): Promise<() => void> {
    return listen("oauth://url", (event: Event<string>) => {
      callback(event.payload)
    })
  },

  /**
   * Listens for invalid OAuth URLs.
   * @param callback - Function to be called when an invalid URL is received.
   * @returns A promise that resolves with a function to remove the event listener.
   * @example
   * ```typescript
   * import { onInvalidUrl } from '@fabianlars/tauri-plugin-oauth';
   *
   * const unlisten = await onInvalidUrl((error) => {
   *   console.error('Received invalid OAuth URL:', error);
   *   // Handle the error...
   * });
   *
   * // Later, to stop listening:
   * unlisten();
   * ```
   */
  onInvalidUrl(callback: (error: string) => void): Promise<() => void> {
    return listen("oauth://invalid-url", (event: Event<string>) => {
      callback(event.payload)
    })
  },
}
