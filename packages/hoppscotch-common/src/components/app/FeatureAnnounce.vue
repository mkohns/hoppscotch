<template>
  <HoppSmartModal
    v-if="show"
    dialog
    title="Feature Announcement"
    :full-width-body="true"
    styles="sm:max-w-2xl"
    @close="hideModal"
  >
    <template #body>
      <div class="m-5 user-select user-select-all" v-html="html"></div>
    </template>
    <template #footer>
      <div class="footer-container">
        <div class="mt-2">Powered with ❤️ by APICoE</div>
        <div>
          <HoppButtonPrimary label="Close" @click="hideModal" />
        </div>
      </div>
    </template>
  </HoppSmartModal>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    show: boolean
    html: string
  }>(),
  {
    show: false,
  }
)

const emit = defineEmits<{
  (e: "hide-modal"): void
}>()

const hideModal = () => {
  emit("hide-modal")
}
</script>
<style scoped>
.footer-container {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
.left-align {
  text-align: left;
}
</style>
