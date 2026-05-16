<template>
  <main class="body page">
    <section class="container py-12 flex min-h-screen items-center">
      <div class="surface flex flex-col gap-8 w-full">
        <div class="flex flex-col gap-3">
          <p
            class="text-xs text-accent tracking-[0.18em] px-3 py-1 border border-border rounded-full w-fit uppercase"
          >
            ожидание
          </p>
          <div class="flex flex-col gap-3">
            <h1 class="text-4xl heading sm:text-5xl">Ждём второго участника</h1>
            <p class="text-sm text-muted-foreground max-w-xl sm:text-base">
              Комната создана. Как только второй участник войдёт по ссылке,
              можно будет перейти к выбору фильмов.
            </p>
          </div>
        </div>

        <div
          v-if="inviteLink"
          class="p-4 border border-border rounded-md bg-secondary/55 flex flex-col gap-3"
        >
          <span
            class="text-xs text-muted-foreground tracking-[0.16em] uppercase"
          >
            Ссылка приглашения
          </span>
          <div
            class="p-3 border border-border rounded-md bg-muted flex flex-col gap-3 min-w-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <span class="text-sm text-foreground min-w-0 truncate">
              {{ inviteLink }}
            </span>
            <UiButton
              type="button"
              class="shrink-0 gap-2 w-full sm:w-auto"
              :aria-label="copyButtonLabel"
              :title="copyButtonLabel"
              @click="copyInviteLink"
            >
              <UiIcon
                :name="copyButtonIcon"
                size="18"
                data-icon="inline-start"
              />
              <span>{{ copyButtonLabel }}</span>
            </UiButton>
          </div>
          <p
            v-if="copyMessage"
            class="text-xs text-primary px-3 py-2 border border-primary/35 rounded-md bg-primary/10"
            role="alert"
          >
            {{ copyMessage }}
          </p>
        </div>

        <div
          v-else-if="!isInviteLinkLoaded"
          class="p-4 border border-border rounded-md bg-secondary/55 flex flex-col gap-3"
          aria-busy="true"
          aria-live="polite"
        >
          <span
            class="text-xs text-muted-foreground tracking-[0.16em] uppercase"
          >
            Ссылка приглашения
          </span>
          <div
            class="p-3 border border-border rounded-md bg-muted flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="rounded-md bg-border/70 h-5 w-full animate-pulse" />
            <div
              class="rounded-md bg-border/70 h-10 w-full animate-pulse sm:w-44"
            />
          </div>
        </div>

        <p
          v-else
          class="text-sm text-muted-foreground px-4 py-3 border border-border rounded-md bg-secondary/55"
        >
          Ссылка приглашения пока недоступна для этой комнаты.
        </p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const { getStoredInviteLink, saveInviteLink, session } = useRoomSession()

const sessionId = computed(() => String(route.params.sessionId ?? ''))
const activeSession = computed(() =>
  session.value?.sessionId === sessionId.value ? session.value : null,
)
const storedInviteLink = ref<string | null>(null)
const isInviteLinkLoaded = ref(false)
const copyState = ref<'idle' | 'copied' | 'error'>('idle')
let copyResetTimer: ReturnType<typeof setTimeout> | null = null

const inviteLink = computed(
  () => activeSession.value?.inviteLink ?? storedInviteLink.value,
)
const copyButtonLabel = computed(() =>
  copyState.value === 'copied' ? 'Ссылка скопирована' : 'Скопировать ссылку',
)
const copyButtonIcon = computed(() =>
  copyState.value === 'copied' ? 'check' : 'copy',
)
const copyMessage = computed(() => {
  if (copyState.value === 'error') {
    return 'Не удалось скопировать ссылку. Выдели её вручную.'
  }

  return ''
})

const loadStoredInviteLink = () => {
  storedInviteLink.value = getStoredInviteLink(sessionId.value)
  isInviteLinkLoaded.value = true
}

const resetCopyStateLater = () => {
  if (copyResetTimer) {
    clearTimeout(copyResetTimer)
  }

  copyResetTimer = setTimeout(() => {
    copyState.value = 'idle'
    copyResetTimer = null
  }, 1800)
}

const copyTextToClipboard = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textArea = document.createElement('textarea')

  textArea.value = text
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.inset = '0 auto auto 0'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.select()

  const isCopied = document.execCommand('copy')

  document.body.removeChild(textArea)

  if (!isCopied) {
    throw new Error('Copy command failed')
  }
}

const copyInviteLink = async () => {
  if (!inviteLink.value) {
    return
  }

  try {
    await copyTextToClipboard(inviteLink.value)
    copyState.value = 'copied'
  } catch {
    copyState.value = 'error'
  } finally {
    resetCopyStateLater()
  }
}

watch(
  () => activeSession.value?.inviteLink,
  (activeInviteLink) => {
    if (!activeInviteLink) {
      return
    }

    saveInviteLink(sessionId.value, activeInviteLink)
    storedInviteLink.value = activeInviteLink
  },
  { immediate: true },
)

watch(sessionId, () => {
  isInviteLinkLoaded.value = false
  loadStoredInviteLink()
})

onMounted(() => {
  loadStoredInviteLink()

  const activeInviteLink = activeSession.value?.inviteLink

  if (activeInviteLink) {
    saveInviteLink(sessionId.value, activeInviteLink)
    storedInviteLink.value = activeInviteLink
  }
})

onBeforeUnmount(() => {
  if (copyResetTimer) {
    clearTimeout(copyResetTimer)
  }
})
</script>
