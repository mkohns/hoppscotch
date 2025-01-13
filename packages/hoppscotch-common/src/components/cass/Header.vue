<template>
  <div class="flex pl-4 pr-4">
    <Splitpanes class="smart-splitter">
      <Pane class="pr-2">
        <ul class="list">
          <li class="list-item">
            <h3 class="list-key">Display Name</h3>
            <h3 class="list-value">
              {{ application.displayName }}
            </h3>
          </li>
          <li class="list-item">
            <h3 class="list-key">CASS Id</h3>
            <h4 class="list-value">
              {{ application.applicationId }}
            </h4>
          </li>
          <li class="list-item">
            <h3 class="list-key">Permission Model</h3>
            <h4 class="list-value">
              {{ application.permissionModel }}
            </h4>
          </li>
          <li class="list-item">
            <h3 class="list-key">Created</h3>
            <h4 class="list-value">
              {{ new Date(application.createDate).toLocaleString() }}
            </h4>
          </li>
        </ul>
      </Pane>
      <Pane class="pl-2">
        <ul class="list">
          <li class="list-item">
            <h3 class="list-key">Environment</h3>
            <h4 class="list-value">
              {{ application.environment }}
            </h4>
          </li>
          <li class="list-item">
            <h3 class="list-key">SAP Id</h3>
            <h4 class="list-value">
              {{ application.apiMgmtApplicationId }}
            </h4>
          </li>
          <li class="list-item">
            <h3 class="list-key">Status</h3>
            <h4 class="list-value">
              {{ application.state }}
            </h4>
          </li>
          <li class="text-right">
            <HoppButtonSecondary
              class="!py-0 bg-blue-500/10 !text-blue-500 font-semibold ml-auto h-7 mt-1"
              label="Open Application in CASS"
              @click="openCASS()"
            />
          </li>
        </ul>
      </Pane>
    </Splitpanes>
  </div>
</template>
<script setup lang="ts">
import { Pane, Splitpanes } from "splitpanes"
import "splitpanes/dist/splitpanes.css"
import { platform } from "~/platform"

const props = defineProps<{
  application: any
}>()

function openCASS() {
  console.log("Open CASS", props.application.applicationId)
  platform.io.openExternalLink(
    `https://cass.dp.schaeffler/applications/${props.application.applicationId}`
  )
}
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
  padding: 8px 0;
  border-bottom: 1px solid var(--divider-light-color);
}

.list-key {
  flex: 1;
  max-width: 30%;
  text-align: left;
}

.list-value {
  flex: 1;
  text-align: right;
  user-select: text;
  color: var(--secondary-dark-color);
}
</style>
