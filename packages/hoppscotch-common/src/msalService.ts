import {
  LogLevel,
  PublicClientApplication,
  NavigationClient,
  NavigationOptions,
  AuthenticationResult,
  EventType,
  INetworkModule,
  NetworkRequestOptions,
  NetworkResponse,
} from "@azure/msal-browser"
import { platform } from "~/platform"
import { AxiosRequestConfig } from "axios"
import { getService } from "~/modules/dioc"
import { InterceptorService } from "~/services/interceptor.service"

const interceptorService = getService(InterceptorService)

enum HttpMethod {
  GET = "get",
  POST = "post",
}

class HttpClientAxios implements INetworkModule {
  /**
   * Http Get request
   * @param url
   * @param options
   */
  async sendGetRequestAsync<T>(
    url: string,
    options?: NetworkRequestOptions
  ): Promise<NetworkResponse<T>> {
    const request: AxiosRequestConfig = {
      method: HttpMethod.GET,
      url: url,
      /* istanbul ignore next */
      headers: options && options.headers,
      /* istanbul ignore next */
      validateStatus: () => true,
    }
    console.log("AxiosGetRequest", request)
    const response = await interceptorService.runRequest(request).response
    console.log("AxiosGetResponse", response)
    const res = response.right
    console.log("res", res)
    return {
      headers: res.headers as Record<string, string>,
      body: res.data as T,
      status: res.status,
    }
  }

  /**
   * Http Post request
   * @param url
   * @param options
   */
  async sendPostRequestAsync<T>(
    url: string,
    options?: NetworkRequestOptions,
    cancellationToken?: number
  ): Promise<NetworkResponse<T>> {
    const request: AxiosRequestConfig = {
      method: HttpMethod.POST,
      url: url,
      /* istanbul ignore next */
      data: (options && options.body) || "",
      timeout: cancellationToken,
      /* istanbul ignore next */
      headers: options && options.headers,
      /* istanbul ignore next */
      validateStatus: () => true,
    }

    try {
      console.log("AxiosPostRequest", request)
      const response = await interceptorService.runRequest(request).response
      console.log("AxiosPostResponse", response)
      const res = response.right
      console.log("res", res)

      const data = new TextDecoder().decode(res.data).replace(/\0+$/, "")
      const parsedData = JSON.parse(data) as T
      console.log("data: " + data)

      const h = { ...res.headers }
      console.log("h", h)

      const obj = {
        headers: h,
        body: parsedData,
        status: res.status,
      }
      console.log("obj", obj)
      return obj
    } catch (error) {
      console.error("sendPostRequestAsync error", error)
      return {
        headers: {},
        body: {} as T,
        status: 0,
      }
    }
  }
}

// Config object to be passed to Msal on creation
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
    authority:
      "https://login.microsoftonline.com/" +
      import.meta.env.VITE_MICROSOFT_TENANT,
    //redirectUri: "postboy://localhost:3000/oauth",
  },
  cache: {
    cacheLocation: "localStorage",
  },
  system: {
    networkClient: new HttpClientAxios(),
    loggerOptions: {
      loggerCallback: (
        level: LogLevel,
        message: string,
        containsPii: boolean
      ) => {
        if (containsPii) {
          return
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message)
            return
          case LogLevel.Info:
            console.info(message)
            return
          case LogLevel.Verbose:
            console.debug(message)
            return
          case LogLevel.Warning:
            console.warn(message)
            return
          default:
            return
        }
      },
      logLevel: LogLevel.Verbose,
    },
  },
}
console.log("msalConfig", msalConfig)
export const msalInstance = new PublicClientApplication(msalConfig)
class CustomNavigationClient extends NavigationClient {
  async navigateExternal(url: string, options: NavigationOptions) {
    console.log(url, options)
    if (url.includes("/oauth2/v2.0/token")) {
      return CustomNavigationClient.defaultNavigation(url, options)
    }
    platform.io.openExternalLink(url.toString())
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true)
      }, options.timeout)
    })
  }
  private static defaultNavigation(
    url: string,
    options: NavigationOptions
  ): Promise<boolean> {
    if (options.noHistory) {
      window.location.replace(url)
    } else {
      window.location.assign(url)
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true)
      }, options.timeout)
    })
  }

  // navigateExternal will use the default
}
const navigationClient = new CustomNavigationClient()
msalInstance.setNavigationClient(navigationClient)

// Add here scopes for id token to be used at MS Identity Platform endpoints.
export const loginRequest = {
  scopes: ["User.Read"],
}

// Add here the endpoints for MS Graph API services you would like to use.
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
}

export const initMSAL = async () => {
  console.log("initMSAL")

  await msalInstance.initialize()

  /*
  await msalInstance.handleRedirectPromise().catch((error) => {
    console.log("handleRedirectPromise error", error)
    return
  })
  */

  // Account selection logic is app dependent. Adjust as needed for different use cases.
  const accounts = msalInstance.getAllAccounts()
  if (accounts.length > 0) {
    console.log("Setting active account", accounts[0])
    msalInstance.setActiveAccount(accounts[0])
  } else {
    console.log("No accounts found")
  }

  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      console.log("LOGIN_SUCCESS", event)
      const payload = event.payload as AuthenticationResult
      const account = payload.account
      msalInstance.setActiveAccount(account)
    }
  })
}
