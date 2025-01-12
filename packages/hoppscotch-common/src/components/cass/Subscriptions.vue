<template>
  <div class="border-t px-4 mx-4">
    <button
      class="w-full flex justify-between items-center py-2"
      @click="toggleAccordion()"
    >
      <span>Subscriptions</span>
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
      <div v-else-if="application.subscriptions.length === 0" class="pb-3">
        No subscriptions found
      </div>
      <div v-else>
        <div
          v-for="(subscription, index) in application.subscriptions"
          :key="index"
        >
          {{ subscription }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, markRaw, watch } from "vue"
import IconPlus from "~icons/lucide/plus"
import IconMinus from "~icons/lucide/minus"

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
<style scoped></style>
