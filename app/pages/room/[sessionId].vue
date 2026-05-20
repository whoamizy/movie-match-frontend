<template>
  <main class="body page">
    <section
      class="mx-auto px-4 py-6 flex max-w-3xl min-h-screen w-full items-center sm:px-8 sm:py-12"
    >
      <div
        class="px-4 py-6 border border-border rounded-md bg-card flex flex-col gap-6 w-full sm:px-8 sm:py-10 sm:gap-8"
      >
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

        <template v-else-if="activeSession && roomStage">
          <div
            v-if="roomStage !== 'FINISHED'"
            class="p-4 border border-accent/45 rounded-md bg-accent/10 flex flex-col gap-2"
            aria-live="polite"
          >
            <UiBadge :variant="participantsBadgeVariant" size="sm">
              участники в комнате{{ participantsLabel }}
            </UiBadge>
            <p class="text-sm text-foreground">
              {{ participantsStatusMessage }}
            </p>
          </div>

          <p
            v-if="realtimeError && roomStage === 'WAITING'"
            class="text-sm text-primary px-4 py-3 border border-primary/35 rounded-md bg-primary/10"
            role="alert"
          >
            {{ realtimeError }}
          </p>

          <RoomWaitingStage
            v-if="roomStage === 'WAITING'"
            :invite-link="inviteLink"
          />
          <RoomFiltersStage
            v-else-if="roomStage === 'FILTERS'"
            :session-id="activeSession.sessionId"
            @preferences-saved="handlePreferencesSaved"
          />
          <RoomChoosingStage v-else-if="roomStage === 'CHOOSING'" />
          <RoomMatchedStage v-else-if="roomStage === 'MATCHED'" />
          <RoomFinishedStage
            v-else-if="roomStage === 'FINISHED'"
            @create-new-room="goHome"
          />
        </template>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { RoomStage } from '~/services/api/selection'

const STAGE_STATUS_LABELS: Record<RoomStage, string> = {
  CHOOSING: 'выбор',
  FILTERS: 'фильтры',
  FINISHED: 'завершено',
  MATCHED: 'совпадение',
  WAITING: 'ожидание',
}
const STAGE_BADGE_VARIANTS: Record<
  RoomStage,
  'accent' | 'muted' | 'success' | 'warning'
> = {
  CHOOSING: 'success',
  FILTERS: 'success',
  FINISHED: 'warning',
  MATCHED: 'success',
  WAITING: 'accent',
}
const STAGE_TITLES: Record<RoomStage, string> = {
  CHOOSING: 'Выбираем фильм',
  FILTERS: 'Настраиваем подборку',
  FINISHED: 'Сессия завершена',
  MATCHED: 'Есть совпадение',
  WAITING: 'Ждём второго участника',
}
const STAGE_DESCRIPTIONS: Record<RoomStage, string> = {
  CHOOSING:
    'Фильтры сохранены на backend. Следующий экран подключит карточки фильмов к готовому API.',
  FILTERS:
    'Оба участника подключены. Выбери жанры, рейтинг и годы выпуска, чтобы подготовить подборку.',
  FINISHED: 'Комната закрыта: оба участника вышли и не вернулись.',
  MATCHED:
    'Найден общий фильм. Следующий шаг покажет карточку совпадения и варианты продолжения.',
  WAITING:
    'Комната создана. Как только второй участник войдёт по ссылке, можно будет перейти к выбору фильмов.',
}

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
const { loadSelectionState, resetRoomStage, roomStage } =
  useRoomStage(activeSession)
const hasCheckedCurrentRoom = ref(Boolean(activeSession.value))

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

  return roomStage.value ? STAGE_STATUS_LABELS[roomStage.value] : 'проверка'
})
const statusBadgeVariant = computed(() => {
  if (isRoomUnavailable.value) {
    return 'warning'
  }

  if (isRecoveringCurrentRoom.value || !roomStage.value) {
    return 'muted'
  }

  return STAGE_BADGE_VARIANTS[roomStage.value]
})
const pageTitle = computed(() => {
  if (isRecoveringCurrentRoom.value) {
    return 'Восстанавливаем комнату'
  }

  if (isRoomUnavailable.value) {
    return 'Сессия комнаты недоступна'
  }

  return roomStage.value ? STAGE_TITLES[roomStage.value] : 'Проверяем комнату'
})
const pageDescription = computed(() => {
  if (isRecoveringCurrentRoom.value) {
    return 'Проверяем cookie-сессию через backend и возвращаем состояние комнаты.'
  }

  if (isRoomUnavailable.value) {
    return 'Эта вкладка не связана с указанной комнатой. Открой актуальную ссылку приглашения или создай новую комнату.'
  }

  return roomStage.value
    ? STAGE_DESCRIPTIONS[roomStage.value]
    : 'Проверяем актуальное состояние комнаты.'
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
const participantsBadgeVariant = computed(() =>
  roomStage.value === 'WAITING' ? 'accent' : 'success',
)
const participantsStatusMessage = computed(() => {
  if (roomStage.value === 'WAITING') {
    return 'Ждём второго участника по ссылке приглашения.'
  }

  if (roomStage.value === 'FILTERS') {
    return 'Комната собрана. Осталось настроить фильтры под общий вечер.'
  }

  if (roomStage.value === 'MATCHED') {
    return 'Оба участника выбрали один фильм.'
  }

  return 'Комната собрана. Можно продолжать подбор.'
})

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

const handlePreferencesSaved = () => {
  void loadSelectionState()
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
  resetRoomStage()
  void ensureCurrentRoom()
})

onMounted(() => {
  void ensureCurrentRoom()
})
</script>
