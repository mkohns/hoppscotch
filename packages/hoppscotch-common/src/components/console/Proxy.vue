<template>
  <div
    class="grid grid-cols-[200px_1fr] ml-3 border-b divide-x divide-dividerLight border-dividerLight"
  >
    <div class="break-all user-select">Proxy</div>
    <div class="break-all user-select">
      {{ log.request?.proxy ? log.request.proxy.url : "No proxy used" }}
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Log } from "../../stores/logger.js"

defineProps<{
  log: Log
}>()
</script>
