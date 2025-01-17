<template>
  <div class="mt-1">
    <div class="flex cursor-pointer items-center" @click="toggleExpand()">
      <div class="">
        <chevron-down v-if="expand" class="w-4 h-4" />
        <chevron-right v-else class="w-4 h-4" />
      </div>
      <div class="ml-3">Query Parameter ({{ getLength() }})</div>
    </div>
    <div v-if="expand" class="ml-10">
      <div
        v-for="(param, index) in params"
        :key="index"
        class="grid grid-cols-[300px_1fr] ml-3 border-b divide-x divide-dividerLight border-dividerLight"
      >
        <div class="break-all user-select">{{ param[0] }}</div>
        <div class="break-all user-select">{{ param[1] }}</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue"
import ChevronDown from "~icons/lucide/chevron-down"
import ChevronRight from "~icons/lucide/chevron-right"

const props = defineProps<{
  url: string
}>()

const params = ref<URLSearchParams>()

onMounted(() => {
  // get the url parameters from prop url
  const url = new URL(props.url)
  params.value = url.searchParams
})

const expand = ref(false)

function getLength() {
  if (params.value === null || params.value === undefined) {
    return 0
  }
  return params.value.size
}

function toggleExpand() {
  expand.value = !expand.value
}
</script>
