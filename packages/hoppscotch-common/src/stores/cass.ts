import { defineStore } from "pinia"
import { ref } from "vue"
import { msalInstance } from "../msalService"
import axios from "axios"
import { useToast } from "@composables/toast"

interface Permissions {
  lastUpdateDate: string
  description: string
  name: string
  permissionId: string
  proxyName: string
  status: string
  tokenScope: string
  type: string
}

interface Secret {
  clientId: string | null
  expiryNotification: string | null
  secretHint: string | null
  secretId: string | null
  secretValidFrom: string | null
  secretValidTo: string | null
}

interface RedirectURI {
  redirectURI: string | null
  redirectURIId: string | null
  type: string | null
}

interface Certificate {
  certifcateId: string | null
  state: string | null
}

interface Subscription {
  lastUpdateDate: string | null
  name: string | null
  title: string | null
  apiProxies: Array<ApiProxy> | null
}

interface ApiProxy {
  basePath: string | null
  name: string | null
  permissionModel: string | null
  title: string | null
  virtualHost: string | null
}

export interface Application {
  lastUpdateDate: string | null
  apiMgmtApplicationId: string | null
  applicationId: string | null
  certificates: Array<Certificate> | null
  createDate: string | null
  displayName: string | null
  environment: string | null
  owners: Array<string> | null
  permissionModel: string | null
  redirectURIs: Array<RedirectURI> | null
  secrets: Array<Secret> | null
  state: string | null
  permissions: Array<Permissions> | null
  itSecId: string | null
  itSecTitle: string | null
  itSecURL: string | null
  subscriptions: Array<Subscription> | null
}

function createDefaultApplication(): Application {
  return {
    lastUpdateDate: null,
    apiMgmtApplicationId: null,
    applicationId: null,
    certificates: null,
    createDate: null,
    displayName: null,
    environment: null,
    owners: null,
    permissionModel: null,
    redirectURIs: null,
    secrets: null,
    state: null,
    permissions: null,
    itSecId: null,
    itSecTitle: null,
    itSecURL: null,
    subscriptions: null,
  }
}

export const useCASSStore = defineStore("cass", () => {
  const applications = ref<Application[]>([])

  const toast = useToast()

  const fetchApplications = async () => {
    try {
      console.log("fetchApplications: fetching applications")
      const tokenResponse = await msalInstance.acquireTokenSilent({
        scopes: [import.meta.env.VITE_CASS_SCOPE],
      })
      const token = tokenResponse.accessToken
      console.log("fetchApplications: token acquired", token)
      console.log("fetchApplications: fetching applications")
      const fetchDate = new Date().toISOString()
      const response = await axios.get(
        import.meta.env.VITE_CASS_BASE_URL + "/applications",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      )
      console.log("fetchApplications: applications fetched", response.data)
      applications.value = response.data.map((app: Application) => {
        const existingApp = applications.value.find(
          (existing) => existing.applicationId === app.applicationId
        )
        const defaultApp = createDefaultApplication()
        return {
          ...defaultApp,
          ...existingApp,
          ...app,
          lastUpdateDate: fetchDate,
          permissions: existingApp?.permissions ?? null,
          subscriptions: null,
        }
      })

      // sort applications by application.displayName
      applications.value.sort((a, b) => {
        if (a.displayName && b.displayName) {
          return a.displayName.localeCompare(b.displayName)
        }
        return 0
      })

      console.log(
        "fetchApplications: storing applications in store",
        applications.value
      )
      // eslint-disable-next-line no-restricted-globals
      localStorage.setItem("applications", JSON.stringify(applications.value))
      toast.success("Applications fetched successfully")
    } catch (error) {
      console.error("Error fetching applications:", error)
    }
  }

  const fetchPermissions = async (applicationId: string) => {
    try {
      console.log(
        "fetchPermissions: fetching permissions for app:",
        applicationId
      )
      const tokenResponse = await msalInstance.acquireTokenSilent({
        scopes: [import.meta.env.VITE_CASS_SCOPE],
      })
      const token = tokenResponse.accessToken
      console.log("fetchPermissions: token acquired", token)
      console.log("fetchPermissions: fetching applications")
      const fetchDate = new Date().toISOString()
      const response = await axios.get(
        import.meta.env.VITE_CASS_BASE_URL +
          "/applications/" +
          applicationId +
          "/permissions",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      )
      console.log("fetchPermissions: permissions fetched", response.data)
      // set the permissions property of the application
      // and set the lastUpdateDate of each permission to fetchDate
      const app = applications.value.find(
        (app) => app.applicationId === applicationId
      )
      if (app) {
        app.permissions = response.data.map((perm: Permissions) => ({
          ...perm,
          lastUpdateDate: fetchDate,
        }))
      }
      console.log(
        "fetchPermissions: storing applications in store",
        applications.value
      )
      // eslint-disable-next-line no-restricted-globals
      localStorage.setItem("applications", JSON.stringify(applications.value))
    } catch (error) {
      console.error("Error fetching permissions:", error)
    }
  }

  const fetchSubscriptions = async (applicationId: string) => {
    try {
      console.log(
        "fetchSubscriptions: fetching subscriptions for app:",
        applicationId
      )
      const tokenResponse = await msalInstance.acquireTokenSilent({
        scopes: [import.meta.env.VITE_CASS_SCOPE],
      })
      const token = tokenResponse.accessToken
      console.log("fetchSubscriptions: token acquired", token)
      console.log("fetchSubscriptions: fetching applications")
      const fetchDate = new Date().toISOString()
      const response = await axios.get(
        import.meta.env.VITE_CASS_BASE_URL +
          "/applications/" +
          applicationId +
          "/subscriptions",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      )
      console.log("fetchSubscriptions: subscriptions fetched", response.data)
      // set the permissions property of the application
      // and set the lastUpdateDate of each permission to fetchDate
      const app = applications.value.find(
        (app) => app.applicationId === applicationId
      )
      if (app) {
        app.subscriptions = response.data.map((subs: Subscription) => ({
          ...subs,
          lastUpdateDate: fetchDate,
        }))
      }
      console.log(
        "fetchSubscriptions: storing applications in store",
        applications.value
      )
      // eslint-disable-next-line no-restricted-globals
      localStorage.setItem("applications", JSON.stringify(applications.value))
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    }
  }

  const getApplications = (searchTerm: string) => {
    console.log("getApplication: getting applications", searchTerm)
    if (applications.value.length === 0) {
      console.log("getApplication: no applications found, looking in store")
      // eslint-disable-next-line no-restricted-globals
      const storedApplications = localStorage.getItem("applications")
      if (storedApplications) {
        console.log("getApplication: found applications in store")
        applications.value = JSON.parse(storedApplications)
      } else {
        console.log("getApplication: no applications found in store, fetching")
        fetchApplications()
      }
    }
    console.log("getApplication: returning previously fetched applications")
    if (searchTerm === "" || searchTerm === null) {
      return applications.value
    }
    // filter applications based on search term
    return applications.value.filter((app) => {
      // check if the search term is in the application name
      // or in the application id
      // or in the owner list
      return (
        app.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.owners?.some((owner) =>
          owner.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    })
  }

  const getPermissions = async (applicationId: string | null) => {
    if (!applicationId) {
      return []
    }
    const app = applications.value.find(
      (app) => app.applicationId === applicationId
    )
    if (!app) {
      return []
    }
    if (!app.permissions) {
      console.log("getPermissions: no permissions found, fetching")
      fetchPermissions(applicationId)
    }
    return app.permissions
  }

  const getSubscriptions = async (applicationId: string | null) => {
    if (!applicationId) {
      return []
    }
    const app = applications.value.find(
      (app) => app.applicationId === applicationId
    )
    if (!app) {
      return []
    }
    if (!app.subscriptions) {
      console.log("getSubscriptions: no permissions found, fetching")
      fetchSubscriptions(applicationId)
    }
    return app.subscriptions
  }

  return {
    applications,
    getApplications,
    fetchApplications,
    getPermissions,
    fetchPermissions,
    getSubscriptions,
    fetchSubscriptions,
  }
})
