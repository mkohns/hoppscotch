<template>
  <div class="mt-1">
    <div class="flex cursor-pointer items-center" @click="toggleExpand()">
      <div class="">
        <chevron-down v-if="expand" class="w-4 h-4" />
        <chevron-right v-else class="w-4 h-4" />
      </div>
      <div class="ml-3">{{ title }} ({{ getLength() }})</div>
    </div>
    <div v-if="expand" class="ml-10">
      <div
        class="grid grid-cols-[300px_1fr] ml-3 border-b divide-x divide-dividerLight border-dividerLight"
      >
        <div class="break-all user-select">Type</div>
        <div class="break-all user-select">{{ getBodyType() }}</div>
      </div>
      <div
        class="grid grid-cols-[300px_1fr] ml-3 border-b divide-x divide-dividerLight border-dividerLight"
      >
        <div class="break-all user-select">Content</div>
        <div class="break-all user-select">{{ getBody() }}</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue"
import type { BodyDef } from "../../stores/logger.js"
import ChevronDown from "~icons/lucide/chevron-down"
import ChevronRight from "~icons/lucide/chevron-right"

const props = defineProps<{
  body: BodyDef | number[] | undefined
  title: string
}>()

const expand = ref(false)

function toggleExpand() {
  expand.value = !expand.value
}

function getLength() {
  if (!props.body) {
    return "none"
  }
  if ("Text" in props.body && props.body.Text !== null) {
    return props.body.Text.length + " bytes"
  }

  if (
    Array.isArray(props.body) &&
    props.body.every((item) => typeof item === "number")
  ) {
    return props.body.length + " bytes"
  }

  return "unknown"
}

function getBody() {
  if (!props.body) {
    return ""
  }
  if (
    "Text" in props.body &&
    props.body.Text !== null &&
    props.body.Text !== undefined
  ) {
    return props.body.Text
  }
  if (
    "URLEncoded" in props.body &&
    props.body.URLEncoded !== null &&
    props.body.URLEncoded !== undefined
  ) {
    return props.body.URLEncoded
  }
  if (
    "FormData" in props.body &&
    props.body.FormData !== null &&
    props.body.FormData !== undefined
  ) {
    return props.body.FormData
  }
  if (
    Array.isArray(props.body) &&
    props.body.every((item) => typeof item === "number")
  ) {
    return new TextDecoder().decode(new Uint8Array(props.body))
  }
}

function getBodyType() {
  if (!props.body) {
    return "none"
  }
  if (
    "Text" in props.body &&
    props.body.Text !== null &&
    props.body.Text !== undefined
  ) {
    return "Text"
  }
  if (
    "URLEncoded" in props.body &&
    props.body.URLEncoded !== null &&
    props.body.URLEncoded !== undefined
  ) {
    return "JSON"
  }
  if (
    "FormData" in props.body &&
    props.body.FormData !== null &&
    props.body.FormData !== undefined
  ) {
    return "Form Data"
  }
  if (
    Array.isArray(props.body) &&
    props.body.every((item) => typeof item === "number")
  ) {
    return "Array"
  }
}
</script>
