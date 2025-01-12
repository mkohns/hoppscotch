<template>
  <div class="border-t px-4 mx-4">
    <button
      class="w-full flex justify-between items-center py-2"
      @click="toggleAccordion()"
    >
      <span>Owners</span>
      <span class="transition-transform duration-300">
        <HoppButtonSecondary class="flex pt-0 pb-0" :icon="icon" />
      </span>
    </button>
    <div
      ref="content"
      class="max-h-0 overflow-hidden transition-all duration-300 ease-in-out"
    >
      <div class="flex">
        <ul class="list mb-2">
          <li
            v-for="(owner, index) in application.owners"
            :key="index"
            class="list-item"
          >
            <h3 class="list-key">
              {{ owner }}
            </h3>
          </li>
        </ul>
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
.list {
  width: 100%;
  list-style-type: none;
}

.list-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--divider-light-color);
}

.list-key {
  flex: 1;
  text-align: left;
  font-weight: bold;
}

.list-value {
  flex: 1;
  text-align: right;
}
</style>
