<template>
  <div class="mt-1">
    <div class="flex cursor-pointer items-center" @click="toggleExpand()">
      <div class="">
        <chevron-down v-if="expand" class="w-4 h-4" />
        <chevron-right v-else class="w-4 h-4" />
      </div>
      <div class="ml-3">{{ title }} ({{ headers.length }})</div>
    </div>
    <div v-if="expand" class="ml-10 mt-1">
      <div
        v-for="(header, headerIndex) in headers"
        :key="headerIndex"
        class="grid grid-cols-[300px_1fr] ml-3 border-b divide-x divide-dividerLight border-dividerLight"
      >
        <div class="break-all user-select">{{ header.key }}</div>
        <div class="break-all user-select">{{ header.value }}</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue"
import type { KeyValuePair } from "../../stores/logger.ts"
import ChevronDown from "~icons/lucide/chevron-down"
import ChevronRight from "~icons/lucide/chevron-right"

defineProps<{
  headers: KeyValuePair[]
  title: string
}>()

const expand = ref(false)

function toggleExpand() {
  expand.value = !expand.value
}
</script>
