<template>
  <HoppSmartModal
    v-if="show"
    dialog
    title="Token Inspector"
    :full-width-body="true"
    styles="sm:max-w-4xl"
    @close="hideModal"
  >
    <template #body>
      <div class="m-5 user-select user-select-all">
        <vue-json-pretty
          show-icon
          :show-line="false"
          :highlight-selected-node="true"
          :show-select-controller="true"
          :data="tokenClaims"
        >
          <template #renderNodeValue="{ node, defaultValue }">
            <template
              v-if="
                node.key === 'iat' || node.key === 'exp' || node.key === 'nbf'
              "
            >
              <a :href="node.content" target="_blank">
                {{ node.content }}
                <span class="ml-3 font-sans text-xs"
                  >({{ new Date(node.content * 1000).toLocaleString() }})
                  injected by postboy</span
                ></a
              >
            </template>
            <template v-else>{{ defaultValue }} </template>
          </template>
        </vue-json-pretty>
      </div>
    </template>
    <template #footer>
      <div class="footer-container">
        <div class="mt-2">Powered with ❤️ by APICoE</div>
        <div>
          <HoppButtonPrimary
            class="mr-3"
            label="Open JWT.ms"
            @click="openJWTms()"
          />
          <HoppButtonPrimary
            label="Help on Attributes"
            @click="helpOnAttributes()"
          />
        </div>
      </div>
    </template>
  </HoppSmartModal>
</template>

<script setup lang="ts">
import VueJsonPretty from "vue-json-pretty"
import "vue-json-pretty/lib/styles.css"
import { platform } from "~/platform"
import { useClipboard } from "@vueuse/core"
import { useToast } from "@composables/toast"
import { computed } from "vue"

const { copy } = useClipboard()
const toast = useToast()

const props = withDefaults(
  defineProps<{
    show: boolean
    rawToken: string
  }>(),
  {
    show: false,
  }
)

const tokenClaims = computed(() => {
  try {
    return JSON.parse(atob(props.rawToken.split(".")[1]))
  } catch (e) {
    return {}
  }
})

function openJWTms() {
  copy(props.rawToken)
  toast.success("Copied Token to clipboard")
  platform.io.openExternalLink("https://jwt.ms/")
}

function helpOnAttributes() {
  platform.io.openExternalLink("https://www.iana.org/assignments/jwt/jwt.xhtml")
}

const emit = defineEmits<{
  (e: "hide-modal"): void
}>()

const hideModal = () => {
  emit("hide-modal")
}
</script>
<style scoped>
.footer-container {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
.left-align {
  text-align: left;
}
</style>
