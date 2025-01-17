<template>
  <div
    class="grid grid-cols-[200px_1fr] ml-3 border-b divide-x divide-dividerLight border-dividerLight"
  >
    <div class="break-all user-select">Error</div>
    <div class="break-all user-select">
      {{ error }}
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  error: unknown
}>()
</script>
