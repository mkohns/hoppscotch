<template>
  <div class="border-t px-4 mx-4">
    <button
      class="w-full flex justify-between items-center py-2"
      @click="toggleAccordion()"
    >
      <span class="flex-row flex"
        ><IconSub class="mr-2 w-4 h-4 flex" />Subscriptions</span
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
        v-if="application.subscriptions === null"
        class="flex flex-row items-center justify-center pb-3"
      >
        <HoppSmartSpinner />
        <span class="text-secondaryLight ml-2 mb-2"> Loading... </span>
      </div>
      <div v-else>
        <div
          v-for="(subscription, index) in application.subscriptions"
          :key="index"
        >
          <div class="mb-2">
            Product: <span class="item">{{ subscription.title }}</span>
          </div>
          <div
            v-for="(proxy, proxyindex) in subscription.apiProxies"
            :key="proxyindex"
          >
            <div class="grid grid-cols-12 gap-4 mb-2 ml-3">
              <div class="col-span-4">
                API: <span class="item">{{ proxy.name }}</span>
              </div>
              <div class="col-span-7 item user-select">
                {{ "https://" + proxy.virtualHost + proxy.basePath }}
              </div>
              <HoppButtonSecondary
                class="!p-0 !focus-visible:text-emerald-600 !hover:text-emerald-600 !text-emerald-500 bg-emerald-500/10"
                label="Import"
                @click="importAPI(proxy)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, markRaw, watch } from "vue"
import IconPlus from "~icons/lucide/plus"
import IconMinus from "~icons/lucide/minus"
import IconSub from "~icons/lucide/calendar-heart"

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
  () => props.application.subscriptions,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      console.log("Subscriptions updated")
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

function importAPI(proxy: any) {
  console.log("Importing API", proxy)
}

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
}
</style>
