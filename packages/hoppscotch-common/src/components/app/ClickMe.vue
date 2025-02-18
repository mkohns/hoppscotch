<template>
  <HoppSmartModal
    dialog
    title="Schaeffler Postboy Beta Version 🚀"
    :full-width-body="true"
    styles="sm:max-w-3xl"
    @close="hideModal"
  >
    <template #body>
      <div class="modal flex flex-col">
        <p class="font-bold">Why Schaeffler Postboy?</p>
        <p class="mt-2">
          Postman and Insomnia are great tools for API testing, but they are are
          moving towards a paid model with cloud enforcement.The clouds where
          your data (and credentials) are stored are in the US and thereby
          subject to US laws.
        </p>
        <p class="mt-2">
          We at Schaeffler want to have this sensitive data under our control.
          Postboy is based on the well-know Hoppscotch project. It is completely
          self-hosted in the Schaeffler private infrastructure and can be used
          by anyone in the company. It is a simple, fast and easy to use tool
          for making HTTP requests.
        </p>
        <p class="mt-2">
          Surely - it is not as feature-rich or bug free as Postman or Insomnia,
          but it is a good starting point we want to evaluate together with you!
        </p>
        <p class="mt-2">
          We already enhanced Postboy to support the Schaeffler API
          infrastructure. We added automatic proxy support, certificate
          injection, CASS integration and features around OAuth2.
        </p>
        <p class="font-bold mt-4">Contribute to Postboy!</p>
        <p class="mt-2">
          With Postboy, we want to explore new paths within Schaeffler.
          <span class="font-bold underline"
            >There is no division which is responsible for Postboy.</span
          >
          There is no Product Owner or central Team. We, as the community, as
          the users, are responsible for Postboy.
        </p>
        <p class="mt-2">
          You need a new feature, found a bug or have an idea for improvement?
          Open an issue or discussion and let's talk about it. You can code? You
          are familiar with vuejs, nodejs or rust? Step in and contribute to the
          project. We help you getting started!
        </p>

        <div class="button-container">
          <HoppButtonPrimary
            label="Join the Postboy Community"
            outline
            class="mt-7"
            style="width: 200px"
            @click="openCommunity"
          ></HoppButtonPrimary>
        </div>
      </div>
    </template>
  </HoppSmartModal>
</template>

<script setup lang="ts">
import { HoppButtonPrimary } from "@hoppscotch/ui"
import { platform } from "~/platform"

function openCommunity() {
  platform.io.openExternalLink(
    `https://community.api.schaeffler.com/c/postboy/`
  )
}

const emit = defineEmits<{
  (e: "hide-modal"): void
}>()

const hideModal = () => {
  emit("hide-modal")
}
</script>

<style scoped>
.modal {
  margin-top: 20px;
  margin-left: 20px;
  margin-right: 20px;
  margin-bottom: 20px;
}
.button-container {
  display: flex;
  justify-content: center; /* Center horizontally */
}
</style>
