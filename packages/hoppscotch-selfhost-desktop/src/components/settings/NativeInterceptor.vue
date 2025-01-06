<template>
  <div class="py-4 space-y-4">
    <div class="flex items-center">
      <HoppSmartToggle
        :on="allowSSLVerification"
        @change="allowSSLVerification = !allowSSLVerification"
      />
      Verify SSL Certificates
    </div>

    <div class="flex space-x-4">
      <HoppButtonSecondary
        :icon="IconLucideFileBadge"
        :label="'CA Certificates'"
        outline
        @click="showCACertificatesModal = true"
      />
      <HoppButtonSecondary
        :icon="IconLucideFileKey"
        :label="'Client Certificates'"
        @click="showClientCertificatesModal = true"
        outline
      />
    </div>

    <ModalsNativeCACertificates
      :show="showCACertificatesModal"
      @hide-modal="showCACertificatesModal = false"
    />
    <ModalsNativeClientCertificates
      :show="showClientCertificatesModal"
      @hide-modal="showClientCertificatesModal = false"
    />

    <div class="pt-4 space-y-4">
      <div class="flex items-center">
        <HoppSmartToggle :on="allowProxy" @change="allowProxy = !allowProxy" />
        Use HTTP Proxy
      </div>

      <HoppSmartInput
        v-if="allowProxy"
        v-model="proxyURL"
        :autofocus="false"
        styles="flex-1"
        placeholder=" "
        :label="'Proxy URL'"
        input-styles="input floating-input"
      />

      <p class="my-1 text-secondaryLight">
        The proxy is set to your default Schaeffler zScaler proxy on localhost
        port 9000. The rootCAs from zScaler are already added to the app.
      </p>
    </div>
  </div>
</template>

<!-- TODO: i18n -->
<script setup lang="ts">
import { computed, ref } from "vue"
import IconLucideFileBadge from "~icons/lucide/file-badge"
import IconLucideFileKey from "~icons/lucide/file-key"
import { useService } from "dioc/vue"
import {
  RequestDef,
  NativeInterceptorService,
} from "@platform/interceptors/native"
import { syncRef } from "@vueuse/core"

type RequestProxyInfo = RequestDef["proxy"]

const nativeInterceptorService = useService(NativeInterceptorService)

const allowSSLVerification = nativeInterceptorService.validateCerts

const showCACertificatesModal = ref(false)
const showClientCertificatesModal = ref(false)

const allowProxy = ref(false)
const proxyURL = ref("")

const proxyUserInfo = computed<RequestProxyInfo>({
  get() {
    return {
      url: proxyURL.value,
    }
  },
  set(newData) {
    proxyURL.value = newData.url
  },
})

const proxyEnabled = computed<boolean>({
  get() {
    return allowProxy.value
  },
  set(newData) {
    allowProxy.value = newData
  },
})

syncRef(nativeInterceptorService.proxyUserInfo, proxyUserInfo, {
  direction: "both",
})
syncRef(nativeInterceptorService.proxyEnabled, proxyEnabled, {
  direction: "both",
})
</script>
