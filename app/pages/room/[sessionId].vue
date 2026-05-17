<template>
  <main class="body page">
    <section class="container py-12 flex min-h-screen items-center">
      <div class="surface flex flex-col gap-8 w-full">
        <div class="flex flex-col gap-3">
          <p
            class="text-xs text-accent tracking-widest px-3 py-1 border border-border rounded-full w-fit uppercase"
          >
            {{ statusLabel }}
          </p>
          <div class="flex flex-col gap-3">
            <h1 class="text-4xl heading sm:text-5xl">
              {{ pageTitle }}
            </h1>
            <p class="text-sm text-muted-foreground max-w-xl sm:text-base">
              {{ pageDescription }}
            </p>
          </div>
        </div>

        <div
          v-if="isRecoveringCurrentRoom"
          class="p-4 border border-border rounded-md bg-secondary/55 flex flex-col gap-3"
          aria-busy="true"
          aria-live="polite"
        >
          <span class="text-xs text-muted-foreground tracking-widest uppercase">
            восстановление
          </span>
          <div class="p-3 border border-border rounded-md bg-muted">
            <div class="rounded-md bg-border/70 h-5 w-full animate-pulse" />
          </div>
        </div>

        <div
          v-else-if="isRoomUnavailable"
          class="p-4 border border-primary/35 rounded-md bg-primary/10 flex flex-col gap-4"
          role="alert"
        >
          <p class="text-sm text-primary">
            {{ roomUnavailableMessage }}
          </p>
          <UiButton
            type="button"
            class="w-full sm:w-fit"
            :disabled="isLoadingCurrent"
            :aria-busy="isLoadingCurrent"
            @click="retryLoadCurrentRoom"
          >
            {{ isLoadingCurrent ? 'Проверяем сессию...' : 'Проверить ещё раз' }}
          </UiButton>
        </div>

        <div
          v-else-if="isActiveSessionReady"
          class="p-4 border border-accent/45 rounded-md bg-accent/10 flex flex-col gap-2"
          aria-live="polite"
        >
          <span class="text-xs text-accent tracking-widest uppercase">
            участники в комнате{{ participantsLabel }}
          </span>
          <p class="text-sm text-foreground">
            Можно запускать следующий этап подбора, когда он будет готов в MVP.
          </p>
        </div>

        <p
          v-if="realtimeError && activeSession && !isActiveSessionReady"
          class="text-sm text-primary px-4 py-3 border border-primary/35 rounded-md bg-primary/10"
          role="alert"
        >
          {{ realtimeError }}
        </p>

        <div
          v-if="activeSession && !isActiveSessionReady"
          class="p-4 border border-border rounded-md bg-secondary/55 flex flex-col gap-3"
        >
          <span class="text-xs text-muted-foreground tracking-widest uppercase">
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
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const {
  error,
  isLoadingCurrent,
  loadCurrentRoom,
  participantsCount,
  saveInviteLink,
  session,
} = useRoomSession()

const sessionId = computed(() => String(route.params.sessionId ?? ''))
const { error: realtimeError } = useRoomRealtime(sessionId)
const activeSession = computed(() =>
  session.value?.sessionId === sessionId.value ? session.value : null,
)
const isActiveSessionReady = computed(
  () => activeSession.value?.status === 'READY',
)
const hasCheckedCurrentRoom = ref(Boolean(activeSession.value))
const copyState = ref<'idle' | 'copied' | 'error'>('idle')
let copyResetTimer: ReturnType<typeof setTimeout> | null = null

const isRecoveringCurrentRoom = computed(
  () =>
    !activeSession.value &&
    (!hasCheckedCurrentRoom.value || isLoadingCurrent.value),
)
const isRoomUnavailable = computed(
  () =>
    hasCheckedCurrentRoom.value &&
    !isLoadingCurrent.value &&
    !activeSession.value,
)
const statusLabel = computed(() => {
  if (isRecoveringCurrentRoom.value) {
    return 'проверка'
  }

  if (isRoomUnavailable.value) {
    return 'недоступно'
  }

  return isActiveSessionReady.value ? 'готово' : 'ожидание'
})
const pageTitle = computed(() => {
  if (isRecoveringCurrentRoom.value) {
    return 'Восстанавливаем комнату'
  }

  if (isRoomUnavailable.value) {
    return 'Сессия комнаты недоступна'
  }

  return isActiveSessionReady.value
    ? 'Сервис готов к работе'
    : 'Ждём второго участника'
})
const pageDescription = computed(() => {
  if (isRecoveringCurrentRoom.value) {
    return 'Проверяем cookie-сессию через backend и возвращаем состояние комнаты.'
  }

  if (isRoomUnavailable.value) {
    return 'Эта вкладка не связана с указанной комнатой. Открой актуальную ссылку приглашения или создай новую комнату.'
  }

  return isActiveSessionReady.value
    ? 'Оба участника подключены. Следующим шагом здесь появятся фильтры и карточки фильмов.'
    : 'Комната создана. Как только второй участник войдёт по ссылке, можно будет перейти к выбору фильмов.'
})
const roomUnavailableMessage = computed(
  () =>
    error.value ??
    'Backend не подтвердил доступ к этой комнате для текущей cookie-сессии.',
)
const inviteLink = computed(() => activeSession.value?.inviteLink ?? '')
const participantsLabel = computed(() => {
  if (!participantsCount.value) {
    return ''
  }

  return ` · ${participantsCount.value}/2`
})
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

const ensureCurrentRoom = async () => {
  if (activeSession.value || isLoadingCurrent.value) {
    hasCheckedCurrentRoom.value = true
    return
  }

  hasCheckedCurrentRoom.value = false

  try {
    await loadCurrentRoom()
  } catch {
    // The page shows a user-facing unavailable state.
  } finally {
    hasCheckedCurrentRoom.value = true
  }
}

const retryLoadCurrentRoom = () => {
  void ensureCurrentRoom()
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
  },
  { immediate: true },
)

watch(sessionId, () => {
  hasCheckedCurrentRoom.value = Boolean(activeSession.value)
  void ensureCurrentRoom()
})

onMounted(() => {
  void ensureCurrentRoom()
})

onBeforeUnmount(() => {
  if (copyResetTimer) {
    clearTimeout(copyResetTimer)
  }
})
</script>
