<template>
  <div
    class="grid grid-cols-[200px_1fr] ml-3 border-b divide-x divide-dividerLight border-dividerLight"
  >
    <div class="break-all user-select">SSLVerify</div>
    <div class="break-all user-select">
      {{ log.request?.validate_certs ? "Enabled" : "Disabled" }}
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Log } from "../../stores/logger.js"

defineProps<{
  log: Log
}>()
</script>
