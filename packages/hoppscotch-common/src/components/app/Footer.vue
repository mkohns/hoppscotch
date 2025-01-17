<template>
  <div>
    <div class="flex justify-between bg-primary">
      <div class="flex">
        <HoppButtonSecondary
          v-tippy="{ theme: 'tooltip' }"
          :title="EXPAND_NAVIGATION ? t('hide.sidebar') : t('show.sidebar')"
          :icon="IconSidebar"
          class="transform"
          :class="{ '-rotate-180': !EXPAND_NAVIGATION }"
          @click="EXPAND_NAVIGATION = !EXPAND_NAVIGATION"
        />
        <tippy interactive trigger="click" theme="popover">
          <HoppButtonSecondary
            v-tippy="{ theme: 'tooltip' }"
            :title="t('settings.interceptor')"
            :icon="IconShieldCheck"
          />
          <template #content>
            <AppInterceptor />
          </template>
        </tippy>
        <HoppButtonSecondary
          v-if="platform.platformFeatureFlags.cookiesEnabled ?? false"
          :label="t('app.cookies')"
          :icon="IconCookie"
          @click="showCookiesModal = true"
        />
        <HoppButtonSecondary
          :icon="IconSse"
          class="!rounded-none"
          :color="subStatus ? 'green' : 'red'"
          :label="subStatus ? 'Online' : 'Offline'"
        />
        <HoppButtonSecondary
          class="!rounded-none"
          :label="getConsoleLabel()"
          @click="LOGGER = !LOGGER"
        />
      </div>
      <div class="flex">
        <tippy
          interactive
          trigger="click"
          theme="popover"
          :on-shown="() => tippyActions!.focus()"
        >
          <HoppButtonSecondary
            :icon="IconHelpCircle"
            class="!rounded-none"
            :label="`${t('app.help')}`"
          />
          <template #content="{ hide }">
            <div
              ref="tippyActions"
              class="flex flex-col focus:outline-none"
              tabindex="0"
              @keyup.d="documentation!.$el.click()"
              @keyup.s="shortcuts!.$el.click()"
              @keyup.c="chat!.$el.click()"
              @keyup.escape="hide()"
            >
              <HoppSmartItem
                ref="documentation"
                :icon="IconBook"
                :label="`${t('app.documentation')}`"
                to="https://cass.dp.schaeffler/postboy"
                blank
                :shortcut="['D']"
                @click="hide()"
              />
              <HoppSmartItem
                ref="shortcuts"
                :icon="IconZap"
                :label="`${t('app.keyboard_shortcuts')}`"
                :shortcut="['S']"
                @click="
                  () => {
                    invokeAction('flyouts.keybinds.toggle')
                    hide()
                  }
                "
              />
              <HoppSmartItem
                ref="teamschannel"
                :icon="IconHandShake"
                label="Teams Channel"
                to="https://teams.microsoft.com/l/team/19%3AOGG-WbPKZOPQ66Tloj-o0NaNdDFInZT0QJORGHMlQyg1%40thread.tacv2/conversations?groupId=ac301a8b-1db4-45a3-8dd7-9bdb904de8c8&tenantId=67416604-6509-4014-9859-45e709f53d3f"
                blank
                :shortcut="['T']"
                @click="hide()"
              />
              <template
                v-for="footerItem in platform.ui?.additionalFooterMenuItems"
                :key="footerItem.id"
              >
                <HoppSmartItem
                  v-if="footerItem.action.type === 'link'"
                  :icon="footerItem.icon"
                  :label="footerItem.text(t)"
                  :to="footerItem.action.href"
                  blank
                  @click="hide()"
                />
                <HoppSmartItem
                  v-else
                  :icon="footerItem.icon"
                  :label="footerItem.text(t)"
                  blank
                  @click="
                    () => {
                      // @ts-expect-error TypeScript not understanding the type
                      footerItem.action.do()
                      hide()
                    }
                  "
                />
              </template>
              <!---
              <hr />
              <HoppSmartItem
                :icon="IconGithub"
                :label="`${t('app.github')}`"
                to="https://github.com/hoppscotch/hoppscotch"
                blank
                @click="hide()"
              />
              <HoppSmartItem
                :icon="IconTwitter"
                :label="`${t('app.twitter')}`"
                to="https://hoppscotch.io/twitter"
                blank
                @click="hide()"
              />
              <HoppSmartItem
                :icon="IconUserPlus"
                :label="`${t('app.invite')}`"
                @click="
                  () => {
                    invokeAction('modals.share.toggle')
                    hide()
                  }
                "
              />
              <HoppSmartItem
                :icon="IconLock"
                :label="`${t('app.terms_and_privacy')}`"
                to="https://docs.hoppscotch.io/support/privacy"
                blank
                @click="hide()"
              />
              -->
              <div
                class="flex px-4 py-2 opacity-50"
                @dblclick="
                  () => {
                    showDeveloperOptionModal()
                    hide()
                  }
                "
              >
                {{ `${t("app.name")} v${version}` }}
              </div>
            </div>
          </template>
        </tippy>
        <HoppButtonSecondary
          v-tippy="{ theme: 'tooltip', allowHTML: true }"
          :title="`${t(
            'app.shortcuts'
          )} <kbd>${getSpecialKey()}</kbd><kbd>/</kbd>`"
          :icon="IconZap"
          @click="invokeAction('flyouts.keybinds.toggle')"
        />
        <!--
        <HoppButtonSecondary
          v-if="navigatorShare"
          v-tippy="{ theme: 'tooltip' }"
          :icon="IconShare2"
          :title="t('request.share')"
          @click="nativeShare()"
        />
        -->
        <HoppButtonSecondary
          v-tippy="{ theme: 'tooltip' }"
          :title="COLUMN_LAYOUT ? t('layout.row') : t('layout.column')"
          :icon="IconColumns"
          class="transform"
          :class="{ 'rotate-90': !COLUMN_LAYOUT }"
          @click="COLUMN_LAYOUT = !COLUMN_LAYOUT"
        />
        <span
          class="transform transition"
          :class="{
            'rotate-180': SIDEBAR_ON_LEFT,
          }"
        >
          <HoppButtonSecondary
            v-tippy="{ theme: 'tooltip' }"
            :title="SIDEBAR ? t('hide.sidebar') : t('show.sidebar')"
            :icon="IconSidebarOpen"
            class="transform"
            :class="{ 'rotate-180': !SIDEBAR }"
            @click="SIDEBAR = !SIDEBAR"
          />
        </span>
      </div>
    </div>
    <AppDeveloperOptions
      :show="showDeveloperOptions"
      @hide-modal="showDeveloperOptions = false"
    />
    <CookiesAllModal
      :show="showCookiesModal"
      @hide-modal="showCookiesModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import { version } from "~/../package.json"
import IconCookie from "~icons/lucide/cookie"
import IconSidebar from "~icons/lucide/sidebar"
import IconZap from "~icons/lucide/zap"
//import IconShare2 from "~icons/lucide/share-2"
import IconColumns from "~icons/lucide/columns"
import IconSidebarOpen from "~icons/lucide/sidebar-open"
import IconShieldCheck from "~icons/lucide/shield-check"
import IconHandShake from "~icons/lucide/handshake"
import IconBook from "~icons/lucide/book"
//import IconGithub from "~icons/lucide/github"
//import IconTwitter from "~icons/lucide/twitter"
//import IconUserPlus from "~icons/lucide/user-plus"
//import IconLock from "~icons/lucide/lock"
import IconHelpCircle from "~icons/lucide/help-circle"
import IconSse from "~icons/lucide/satellite-dish"
import { useSetting } from "@composables/settings"
import { useI18n } from "@composables/i18n"
import { useReadonlyStream } from "@composables/stream"
import { platform } from "~/platform"
import { TippyComponent } from "vue-tippy"
import { getPlatformSpecialKey as getSpecialKey } from "~/helpers/platformutils"
import { invokeAction } from "@helpers/actions"
import { HoppSmartItem } from "@hoppscotch/ui"
import { gqlClientStatus$ } from "~/helpers/backend/GQLClient"
import { Subscription } from "rxjs"
import { useLoggerStore } from "~/stores/logger"
const t = useI18n()

const showDeveloperOptions = ref(false)
const showCookiesModal = ref(false)

const EXPAND_NAVIGATION = useSetting("EXPAND_NAVIGATION")
const SIDEBAR = useSetting("SIDEBAR")
const LOGGER = useSetting("LOGGER")
const COLUMN_LAYOUT = useSetting("COLUMN_LAYOUT")
const SIDEBAR_ON_LEFT = useSetting("SIDEBAR_ON_LEFT")

const { logs } = useLoggerStore()

//const navigatorShare = !!navigator.share

function getConsoleLabel() {
  return "Console (" + logs.length + ")"
}

const currentUser = useReadonlyStream(
  platform.auth.getCurrentUserStream(),
  platform.auth.getCurrentUser()
)

const subStatus = ref(false)
let subscription: Subscription

onMounted(() => {
  // Subscribe to the Subject
  subscription = gqlClientStatus$.subscribe((event) => {
    if (event === "connected") {
      subStatus.value = true
    } else {
      subStatus.value = false
    }
  })
})

onUnmounted(() => {
  // Make sure to unsubscribe to prevent memory leaks
  if (subscription) {
    subscription.unsubscribe()
  }
})

/*
const nativeShare = () => {
  if (navigator.share) {
    navigator
      .share({
        title: "Hoppscotch",
        text: "Hoppscotch • Open source API development ecosystem - Helps you create requests faster, saving precious time on development.",
        url: "https://hoppscotch.io",
      })
      .catch(console.error)
  } else {
    // fallback
  }
}
*/

const showDeveloperOptionModal = () => {
  if (currentUser.value) {
    showDeveloperOptions.value = true
  }
}

// Template refs
const tippyActions = ref<TippyComponent | null>(null)
const documentation = ref<typeof HoppSmartItem>()
const shortcuts = ref<typeof HoppSmartItem>()
const chat = ref<typeof HoppSmartItem>()
</script>
