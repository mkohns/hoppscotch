<template>
  <div v-if="msal.accounts.length !== 0">
    <Splitpanes class="smart-splitter" style="height: 100%">
      <Pane size="25">
        <div class="flex flex-col h-full">
          <div class="flex justify-between">
            <h3 class="flex heading p-4">Your CASS Apps</h3>
            <div class="flex">
              <HoppButtonSecondary
                v-if="msal.accounts.length !== 0"
                class="flex pr-1"
                :icon="IconRefreshCW"
                @click="refreshApplications()"
              />
              <HoppButtonSecondary
                v-if="msal.accounts.length !== 0"
                class="flex mr-2"
                :icon="IconLogOut"
                @click="logout()"
              />
            </div>
          </div>
          <div v-if="msal.accounts.length !== 0">
            <input
              v-model="searchFilter"
              type="search"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              class="flex w-full bg-transparent px-4 pb-2"
              style="font-size: 0.8rem"
              placeholder="Search"
            />
          </div>
          <div
            v-if="msal.accounts.length !== 0"
            class="flex flex-col flex-grow overflow-y-auto scrollbar-hide"
          >
            <div
              v-for="(app, index) in apps"
              :key="index"
              @click="selectedApp = app"
            >
              <div :class="getClass(app)">
                <div class="flex flex-col space-between flex-grow">
                  <h4 class="flex font-semibold text-secondaryDark">
                    {{ app.displayName }}
                  </h4>

                  <h3 class="flex font-semibold mt-1">
                    {{ app.permissionModel }}
                  </h3>
                </div>
                <div class="flex flex-col justify-center">
                  <h3 class="flex font-semibold mt-1 text-blue-500">
                    {{ getEnvironmentShort(app.environment) }}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Pane>
      <Pane>
        <div class="flex flex-col h-full">
          <h3 class="flex heading pr-4 pl-4 pt-4 pb-3">Application Details</h3>
          <div
            v-if="selectedApp"
            class="flex flex-col h-full flex-grow overflow-y-auto scrollbar-hide"
          >
            <CassHeader :application="selectedApp" />
            <div class="pb-8"></div>
            <CassITSec :application="selectedApp" />
            <CassOwners :application="selectedApp" />
            <CassSecrets :application="selectedApp" />
            <CassCertificates :application="selectedApp" />
            <CassRedirect :application="selectedApp" />
            <CassSubscriptions
              :application="selectedApp"
              @on-load="loadSubscriptions()"
            />
            <CassPermissions
              :application="selectedApp"
              @on-load="loadPermissions()"
            />
          </div>
        </div>
      </Pane>
    </Splitpanes>
  </div>
  <div v-else>
    <div class="flex flex-col h-full w-full justify-center items-center">
      <img :src="getHenryImage()" class="flex w-1/5" />
      <h3 class="flex heading">Please login to view your CASS applications</h3>
      <HoppButtonPrimary class="flex mt-4" label="Login" @click="login()" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance, ref, computed, onMounted } from "vue"
import { Pane, Splitpanes } from "splitpanes"
import IconLogOut from "~icons/lucide/log-out"
import IconRefreshCW from "~icons/lucide/refresh-cw"
//import { useToast } from "@composables/toast"
import { Application, useCASSStore } from "~/stores/cass"
import { platform } from "../platform"
import { html } from "./cass-redirect-page"
import { getPortFromUrl } from "~/helpers/oauth"

import "splitpanes/dist/splitpanes.css"

//const toast = useToast()

const searchFilter = ref<string>("")
const selectedApp = ref<Application | null>(null)
const instance = getCurrentInstance()
const msal = instance ? instance.appContext.config.globalProperties.$msal : null
const cassStore = useCASSStore()
const apps = computed(() => cassStore.getApplications(searchFilter.value))

onMounted(() => {})

function getClass(app: Application) {
  if (selectedApp.value?.applicationId === app.applicationId) {
    return "flex flex-row pl-4 pr-4 pt-3 pb-3 m-1 bg-blue-500/10"
  }
  return "flex flex-row pl-4 pr-4 pt-3 pb-3 m-1 item"
}

function getHenryImage() {
  return import.meta.env.VITE_BACKEND_API_URL + "/files/henry"
}

function loadPermissions() {
  console.log("Loading permissions")
  if (selectedApp.value)
    cassStore.getPermissions(selectedApp.value?.applicationId)
}

function loadSubscriptions() {
  console.log("Loading subscriptions")
  if (selectedApp.value)
    cassStore.getSubscriptions(selectedApp.value?.applicationId)
}

function refreshApplications() {
  console.log("Refreshing applications")
  selectedApp.value = null
  cassStore.fetchApplications()
}

function getEnvironmentShort(environment: string | null) {
  if (environment === "DEVELOPMENT") {
    return "DEV"
  } else if (environment === "QUALITY") {
    return "QA"
  } else if (environment === "PRODUCTION") {
    return "PROD"
  }
}

async function login() {
  console.log("Login")

  const redirectPort = getPortFromUrl(
    import.meta.env.VITE_POSTBOY_CASS_REDIRECT_URL
  )

  console.log("Stopping any existing redirect server")
  await platform.redirect.cancel(redirectPort).catch((error) => {
    console.error("Error stopping redirect server", error)
  })
  console.log("Starting")

  const port = await platform.redirect.start({
    ports: [redirectPort],
    response: html.replaceAll(
      "VITE_BACKEND_API_URL",
      import.meta.env.VITE_BACKEND_API_URL
    ),
  })

  console.log("Redirect Port: ", port)
  const redirectURL = import.meta.env.VITE_POSTBOY_CASS_REDIRECT_URL
  console.log("Redirect URL: ", redirectURL)

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
    const msalURL = url.replace(redirectURL, "")
    console.log("MSAL URL:", msalURL)
    msal.instance.handleRedirectPromise(msalURL).catch((error) => {
      console.log("handleRedirectPromise error", error)
      return
    })
  })
  msal.instance.loginRedirect({
    scopes: ["user.read"],
    redirectUri: redirectURL,
  })
}

function logout() {
  if (msal.accounts.length === 0) {
    console.error("No active account found")
    return
  }

  const account = msal.instance.getActiveAccount()
  console.log("Logging out", account)

  msal.instance.logoutRedirect({
    account: account,
    onRedirectNavigate: (url) => {
      // Return false if you would like to stop navigation after local logout
      console.log("Pseudo Redirecting to:", url)
      return false
    },
  })
}
</script>
<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
}
.item {
  background-color: var(--divider-light-color);
}
</style>
