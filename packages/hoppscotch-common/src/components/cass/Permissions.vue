<template>
  <div class="border-t px-4 mx-4">
    <button
      class="w-full flex justify-between items-center py-2"
      @click="toggleAccordion()"
    >
      <span class="flex-row flex"
        ><IconSub class="mr-2 w-4 h-4 flex" />Permissions</span
      >
      <span class="transition-transform duration-300">
        <HoppButtonSecondary class="flex pb-0 pt-0" :icon="icon" />
      </span>
    </button>
    <div
      ref="content"
      class="max-h-0 overflow-hidden transition-all duration-300 ease-in-out"
    >
      <div
        v-if="application.permissions === null"
        class="flex flex-row items-center justify-center pb-3"
      >
        <HoppSmartSpinner />
        <span class="text-secondaryLight ml-2 mb-2"> Loading... </span>
      </div>
      <div v-else-if="application.permissions.length === 0" class="pb-3">
        No permissions found
      </div>
      <div v-else>
        <div
          v-for="(permission, index) in application.permissions"
          :key="index"
        >
          <div class="grid grid-cols-12 gap-4 mb-2">
            <div class="col-span-6 item">
              {{ permission.name }}
            </div>
            <div class="col-span-3 item user-select">
              {{ permission.status }}
            </div>
            <div class="col-span-2 item user-select">
              {{ permission.type }}
            </div>
            <HoppButtonSecondary
              class="!p-0 !focus-visible:text-emerald-600 !hover:text-emerald-600 !text-emerald-500 bg-emerald-500/10"
              label="TryIt"
              @click="tryit(permission)"
            />
          </div>
        </div>
      </div>
    </div>
    <AppFeatureAnnounce
      :show="showFeatureAnnouncement"
      :html="featureAnnouncement"
      @hide-modal="showFeatureAnnouncement = false"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, markRaw, watch } from "vue"
import IconPlus from "~icons/lucide/plus"
import IconMinus from "~icons/lucide/minus"
import IconSub from "~icons/lucide/key-round"

const showFeatureAnnouncement = ref<boolean>(false)
const featureAnnouncement = ref<string>("")

function tryit(proxy: any) {
  console.log("TryIt", proxy)
  featureAnnouncement.value = `
  <p><strong>You discovered an upcoming feature!</strong></p>
  </br>
  <p><strong>The idea: </strong>By pressing the "TryIt" button on an approved permission, a new tab will open with all necessary configuration to get the token for that permission.</p>
  </br>
  <p><strong>The value: </strong>Easy, one-click and hassle-free way to get the token corresponding to the permission to speed up your journey.</p>
  </br>
  <p>You want it? Let us know!</p>
  `
  showFeatureAnnouncement.value = true
}

const props = defineProps<{
  application: any
}>()

const emit = defineEmits<{
  (e: "onLoad"): void
}>()

watch(
  () => props.application,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      closeAccordion()
    }
  }
)

watch(
  () => props.application.permissions,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      console.log("permissions updated")
      setTimeout(() => {
        if (
          content.value?.style.maxHeight &&
          content.value.style.maxHeight !== "0px"
        ) {
          content.value.style.maxHeight = content.value.scrollHeight + "px"
        }
      }, 100)
    }
  }
)

function closeAccordion() {
  if (!content.value) return
  content.value.style.maxHeight = "0"
  icon.value = markRaw(IconPlus)
}

const content = ref<HTMLElement>()
const icon = ref(markRaw(IconPlus))

function toggleAccordion() {
  if (!content.value) return
  if (
    content.value.style.maxHeight &&
    content.value.style.maxHeight !== "0px"
  ) {
    content.value.style.maxHeight = "0"
    icon.value = markRaw(IconPlus)
  } else {
    content.value.style.maxHeight = content.value.scrollHeight + "px"
    icon.value = markRaw(IconMinus)
    emit("onLoad")
  }
}
</script>
<style scoped>
.item {
  color: var(--secondary-dark-color);
  user-select: text;
}
</style>
