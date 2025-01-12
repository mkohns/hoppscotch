import {
  LogLevel,
  PublicClientApplication,
  AuthenticationResult,
  EventType,
} from "@azure/msal-browser"

// Config object to be passed to Msal on creation
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
    authority:
      "https://login.microsoftonline.com/" +
      import.meta.env.VITE_MICROSOFT_TENANT,
  },
  cache: {
    cacheLocation: "localStorage",
  },
  system: {
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

  await msalInstance.initialize().then(() => {
    msalInstance.handleRedirectPromise().catch((error) => {
      console.log("handleRedirectPromise error", error)
      return
    })
  })

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
