<template>
  <main class="body page">
    <section class="container py-12 flex min-h-screen items-center">
      <div class="surface flex flex-col gap-8 w-full">
        <div class="flex flex-col gap-3">
          <UiBadge :variant="statusBadgeVariant">
            {{ statusLabel }}
          </UiBadge>
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
          <UiBadge variant="muted" size="sm"> восстановление </UiBadge>
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
          v-else-if="isActiveSessionClosed"
          class="p-4 border border-primary/35 rounded-md bg-primary/10 flex flex-col gap-4"
          role="status"
          aria-live="polite"
        >
          <p class="text-sm text-primary">
            Сессия завершена. Можно создать новую комнату и начать подбор
            заново.
          </p>
          <UiButton type="button" class="w-full sm:w-fit" @click="goHome">
            Создать новую комнату
          </UiButton>
        </div>

        <div
          v-else-if="isActiveSessionReady"
          class="p-4 border border-accent/45 rounded-md bg-accent/10 flex flex-col gap-2"
          aria-live="polite"
        >
          <UiBadge variant="success" size="sm">
            участники в комнате{{ participantsLabel }}
          </UiBadge>
          <p class="text-sm text-foreground">
            Можно запускать следующий этап подбора, когда он будет готов в MVP.
          </p>
        </div>

        <div
          v-if="isCreatorCloseActionVisible"
          class="p-4 border border-primary/35 rounded-md bg-primary/10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex flex-col gap-2 min-w-0">
            <UiBadge variant="warning" size="sm"> управление сессией </UiBadge>
            <p class="text-sm text-primary">
              Завершение сразу закрывает комнату для всех участников.
            </p>
          </div>
          <UiButton
            type="button"
            class="text-primary-foreground bg-primary shrink-0 gap-2 w-full sm:w-auto"
            :disabled="isClosing"
            :aria-busy="isClosing"
            @click="closeActiveSession"
          >
            <UiIcon name="close-session" size="18" data-icon="inline-start" />
            <span>{{ closeButtonLabel }}</span>
          </UiButton>
        </div>

        <p
          v-if="closeMessage"
          class="text-sm text-primary px-4 py-3 border border-primary/35 rounded-md bg-primary/10"
          role="alert"
        >
          {{ closeMessage }}
        </p>

        <p
          v-if="
            realtimeError &&
            activeSession &&
            !isActiveSessionReady &&
            !isActiveSessionClosed
          "
          class="text-sm text-primary px-4 py-3 border border-primary/35 rounded-md bg-primary/10"
          role="alert"
        >
          {{ realtimeError }}
        </p>

        <div
          v-if="
            activeSession && !isActiveSessionReady && !isActiveSessionClosed
          "
          class="p-4 border border-border rounded-md bg-secondary/55 flex flex-col gap-3"
        >
          <UiBadge variant="muted" size="sm"> Ссылка приглашения </UiBadge>
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
  closeRoom,
  error,
  isClosing,
  isLeaving,
  isLoadingCurrent,
  loadCurrentRoom,
  participantsCount,
  refreshCurrentRoom,
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
const isActiveSessionClosed = computed(
  () => activeSession.value?.status === 'CLOSED',
)
const hasCheckedCurrentRoom = ref(Boolean(activeSession.value))
const copyState = ref<'idle' | 'copied' | 'error'>('idle')
let copyResetTimer: ReturnType<typeof setTimeout> | null = null
let statusSyncTimer: ReturnType<typeof setInterval> | null = null

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

  if (isActiveSessionClosed.value) {
    return 'завершено'
  }

  return isActiveSessionReady.value ? 'готово' : 'ожидание'
})
const statusBadgeVariant = computed(() => {
  if (isRoomUnavailable.value) {
    return 'warning'
  }

  if (isRecoveringCurrentRoom.value) {
    return 'muted'
  }

  if (isActiveSessionClosed.value) {
    return 'warning'
  }

  return isActiveSessionReady.value ? 'success' : 'accent'
})
const pageTitle = computed(() => {
  if (isRecoveringCurrentRoom.value) {
    return 'Восстанавливаем комнату'
  }

  if (isRoomUnavailable.value) {
    return 'Сессия комнаты недоступна'
  }

  if (isActiveSessionClosed.value) {
    return 'Сессия завершена'
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

  if (isActiveSessionClosed.value) {
    return 'Комната закрыта: все участники вышли или создатель явно завершил сессию.'
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
  if (participantsCount.value === null) {
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
const isCreatorCloseActionVisible = computed(() => {
  const status = activeSession.value?.status

  return (
    activeSession.value?.participant.isCreator === true &&
    (status === 'WAITING' || status === 'READY')
  )
})
const closeButtonLabel = computed(() =>
  isClosing.value ? 'Завершаем...' : 'Завершить сессию',
)
const copyMessage = computed(() => {
  if (copyState.value === 'error') {
    return 'Не удалось скопировать ссылку. Выдели её вручную.'
  }

  return ''
})
const closeMessage = computed(() => {
  if (!activeSession.value || !error.value) {
    return ''
  }

  return error.value
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

const goHome = async () => {
  await navigateTo('/')
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

const closeActiveSession = async () => {
  if (!activeSession.value || isClosing.value) {
    return
  }

  try {
    await closeRoom(activeSession.value.sessionId)
  } catch {
    // The page shows a user-facing action error.
  }
}

const syncActiveSessionStatus = () => {
  if (!activeSession.value || isActiveSessionClosed.value || isLeaving.value) {
    return
  }

  void refreshCurrentRoom().catch(() => {
    // Realtime remains the primary path; polling is only a quiet stale-state guard.
  })
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
  statusSyncTimer = setInterval(syncActiveSessionStatus, 2000)
})

onBeforeUnmount(() => {
  if (copyResetTimer) {
    clearTimeout(copyResetTimer)
  }

  if (statusSyncTimer) {
    clearInterval(statusSyncTimer)
  }
})
</script>
