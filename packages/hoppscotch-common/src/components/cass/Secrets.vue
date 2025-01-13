<template>
  <div class="border-t px-4 mx-4">
    <button
      class="w-full flex justify-between items-center py-2"
      @click="toggleAccordion()"
    >
      <span class="flex-row flex"
        ><IconLock class="mr-2 w-4 h-4 flex" />Secrets</span
      >
      <span class="transition-transform duration-300">
        <HoppButtonSecondary class="flex pt-0 pb-0" :icon="icon" />
      </span>
    </button>
    <div
      ref="content"
      class="max-h-0 overflow-hidden transition-all duration-300 ease-in-out"
    >
      <div
        v-if="application.secrets !== null && application.secrets.length === 0"
        class="item mb-3"
      >
        No secrets configured
      </div>
      <div v-else class="">
        <div class="grid grid-cols-4 gap-4 mb-2">
          <div class="col-span-2 font-bold">Secret Hint</div>
          <div class="font-bold">Valid From</div>
          <div class="font-bold">Actions</div>
        </div>
        <ul class="list mb-2">
          <li v-for="(secret, index) in application.secrets" :key="index">
            <div class="grid grid-cols-4 gap-4 mb-2">
              <div class="col-span-2 item">{{ secret.secretHint }}...</div>
              <div class="item">
                {{ new Date(secret.secretValidFrom).toLocaleString() }}
              </div>
              <div class="item">
                {{ new Date(secret.secretValidTo).toLocaleString() }}
              </div>
            </div>
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
import IconLock from "~icons/lucide/lock-keyhole"

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
  text-align: left;
}

.list-value {
  flex: 1;
  text-align: right;
  color: var(--secondary-dark-color);
}

.item {
  flex: 1;
  color: var(--secondary-dark-color);
}
</style>
