<template>
  <div class="border-t px-4 mx-4">
    <button
      class="w-full flex justify-between items-center py-2"
      @click="toggleAccordion()"
    >
      <span class="flex-row flex"
        ><IconShield class="mr-2 w-4 h-4 flex" />IT Security By Design</span
      >
      <span class="transition-transform duration-300">
        <HoppButtonSecondary class="flex pt-0 pb-0" :icon="icon" />
      </span>
    </button>
    <div
      ref="content"
      class="max-h-0 overflow-hidden transition-all duration-300 ease-in-out"
    >
      <div v-if="application.itSecId" class="item mb-3">
        <a :href="application.itSecURL" target="_blank"
          >{{ application.itSecId }} ({{ application.itSecTitle }})</a
        >
      </div>
      <div v-else class="item mb-3">no IT Security Demand configured</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, markRaw, watch } from "vue"
import IconPlus from "~icons/lucide/plus"
import IconMinus from "~icons/lucide/minus"
import IconShield from "~icons/lucide/shield-check"

const props = defineProps<{
  application: any
}>()

watch(
  () => props.application,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      closeAccordion()
    }
  }
)

const content = ref<HTMLElement>()
const icon = ref(markRaw(IconPlus))

function closeAccordion() {
  if (!content.value) return
  content.value.style.maxHeight = "0"
  icon.value = markRaw(IconPlus)
}

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
  }
}
</script>
<style scoped>
.item {
  flex: 1;
  color: var(--secondary-dark-color);
}
</style>
