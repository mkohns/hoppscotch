<template>
  <div class="flex pl-4 pr-4">
    <ul class="list">
      <li class="list-item">
        <h3 class="list-key">Display Name</h3>
        <h3 class="list-value">
          {{ application.displayName }}
        </h3>
      </li>
      <li class="list-item">
        <h3 class="list-key">Permission Model</h3>
        <h4 class="list-value">
          {{ application.permissionModel }}
        </h4>
      </li>
      <li class="list-item">
        <h3 class="list-key">Environment</h3>
        <h4 class="list-value">
          {{ application.environment }}
        </h4>
      </li>
      <li class="list-item">
        <h3 class="list-key">Display Id</h3>
        <h4 class="list-value">
          {{ application.applicationId }}
        </h4>
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  application: any
}>()
</script>
<style scoped>
.list {
  width: 100%;
  list-style-type: none;
  padding: 0;
  margin: 0;
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
