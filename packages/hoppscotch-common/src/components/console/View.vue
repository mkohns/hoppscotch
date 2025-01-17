<template>
  <div ref="container" class="overflow-y-auto h-full">
    <div>
      <div class="grid grid-cols-[150px_1fr_100px] items-center">
        <div class="flex items-center">
          <BugPlay class="w-4 h-4 mr-1"></BugPlay>
          <div>Console</div>
        </div>
        <div></div>
        <HoppButtonSecondary
          label="Clear All"
          class="!m-2 !p-1 !bg-blue-500/10 !text-blue-500"
          outline
          filled
          :icon="TrashBin"
          @click="clearAll()"
        />
      </div>
    </div>

    <div v-if="logs.length === 0">
      <div>No logs yet</div>
      <div>Send a request and analyse here</div>
    </div>
    <div
      v-for="(log, index) in logs"
      v-else
      :key="log.timestamp.getMilliseconds()"
    >
      <div
        v-if="log.request"
        class="border-b divide-x divide-dividerLight border-dividerLight py-2"
        :class="getStatusColor(log)"
      >
        <div
          class="flex cursor-pointer items-start"
          @click="toggleExpand(index)"
        >
          <div class="">
            <chevron-down v-if="expandedLogs[index]" class="w-4 h-4" />
            <chevron-right v-else class="w-4 h-4" />
          </div>
          <div class="grid grid-cols-[150px_60px_1fr] ml-3 w-full">
            <div>{{ log.timestamp.toLocaleString() }}</div>
            <div>{{ log.request.method.toUpperCase() }}</div>
            <div class="break-all user-select">{{ log.request.endpoint }}</div>
          </div>
          <div class="">
            <trash-bin
              class="w-4 h-4 mr-4"
              @click="removeLogItem($event, index)"
            />
          </div>
        </div>
        <div v-if="expandedLogs[index]" class="ml-6 mt-2">
          <ConsoleProxy :log="log" />
          <ConsoleCertValidate :log="log" />
          <ConsoleResponseCode :log="log" />
          <ConsoleError v-if="log.error" :error="log.error" />
          <ConsoleHeaders
            title="Request Headers"
            :headers="log.request?.headers"
          />
          <ConsoleParameters :url="log.request.endpoint" />
          <ConsoleBody :body="log.request?.body" title="Request Body" />
          <ConsoleHeaders
            v-if="log.response"
            title="Response Headers"
            :headers="log.response?.headers"
          />
          <ConsoleBody
            v-if="log.response"
            :body="log.response?.data"
            title="Response Body"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue"
import { useLoggerStore } from "~/stores/logger"
import ChevronDown from "~icons/lucide/chevron-down"
import ChevronRight from "~icons/lucide/chevron-right"
import TrashBin from "~icons/lucide/trash-2"
import BugPlay from "~icons/lucide/bug-play"
import type { Log } from "../../stores/logger.ts"

const { logs, removeLog, clearLogs } = useLoggerStore()
const expandedLogs = ref<boolean[]>([])
const container = ref()

onMounted(() => {
  console.log("Console mounted")
  expandedLogs.value = logs.map(() => false)
})

function clearAll() {
  clearLogs()
}

function getStatusColor(log: Log) {
  if (log.response && log.response.status > 100 && log.response.status < 399)
    return "bg-emerald-500/5 !text-emerald-500"
  if (log.response && log.response.status > 399 && log.response.status < 499)
    return "bg-amber-500/10 !text-amber-500"
  if (log.response && log.response.status > 499 && log.response.status < 599)
    return "bg-red-500/10 !text-red-500"
  if (log.error) return "bg-red-500/10 !text-red-500"

  return "bg-blue-500/10 !text-blue-500"
}

function removeLogItem(evt: Event, index: number) {
  evt.stopPropagation()
  removeLog(index)
  expandedLogs.value.splice(index, 1)
}

const toggleExpand = (index: number) => {
  expandedLogs.value[index] = !expandedLogs.value[index]
}

const updateExpansionStates = () => {
  while (expandedLogs.value.length < logs.length) {
    expandedLogs.value.push(false)
  }
}

function scrollToBottom() {
  nextTick(() => {
    container.value.scrollTop = container.value.scrollHeight
  })
}

watch(
  logs,
  () => {
    updateExpansionStates()
    scrollToBottom()
  },
  { immediate: true }
)
</script>
