<template>
  <div
    tabindex="0"
    class="relative flex items-center justify-center rounded-full cursor-pointer focus:outline-none focus-visible:ring focus-visible:ring-primaryDark"
  >
    <img
      v-if="imageBlobUrl"
      :src="imageBlobUrl"
      :alt="name"
      :title="name"
      class="rounded-full border-2"
      :style="{ width: `${size}px`, height: `${size}px` }"
    />
    <span
      v-if="indicator"
      class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-primary"
      :class="indicatorStyles"
    ></span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { platform } from "~/platform"

const props = withDefaults(
  defineProps<{
    name: string
    photoUrl: string
    indicator: boolean
    indicatorStyles: string
    size: number
  }>(),
  {
    name: "",
    indicator: false,
    indicatorStyles: "bg-green-500",
    size: 32,
  }
)

const imageBlobUrl = ref<string | null>(null)

const fetchImage = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_API_URL}/${props.photoUrl}`,
      {
        headers: platform.auth.getBackendHeaders(),
      }
    )

    if (!response.ok) {
      throw new Error("Failed to fetch image.")
    }

    const blob = await response.blob()
    imageBlobUrl.value = URL.createObjectURL(blob)
  } catch (error) {
    console.error("Error fetching image:", error)
  }
}

onMounted(() => {
  fetchImage()
})
</script>
