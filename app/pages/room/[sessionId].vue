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
            <p
              v-if="pageDescription"
              class="text-sm text-muted-foreground max-w-xl sm:text-base"
            >
              {{ pageDescription }}
            </p>
          </div>
        </div>

        <Transition name="stage" mode="out-in">
          <UiLoader
            v-if="isRecoveringCurrentRoom || isResolvingTerminalStage"
            key="recovering"
            :label="roomLoaderLabel"
          />

          <div
            v-else-if="isRoomUnavailable"
            key="unavailable"
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
              {{ isLoadingCurrent ? 'Проверяем...' : 'Проверить ещё раз' }}
            </UiButton>
          </div>

          <div
            v-else-if="activeSession && roomStage"
            :key="roomContentKey"
            class="flex flex-col gap-6 sm:gap-8"
          >
            <Transition name="fade">
              <p
                v-if="realtimeError && roomStage === 'WAITING'"
                class="text-sm text-primary px-4 py-3 border border-primary/35 rounded-md bg-primary/10"
                role="alert"
              >
                {{ realtimeError }}
              </p>
            </Transition>

            <RoomWaitingStage
              v-if="roomStage === 'WAITING'"
              :invite-link="inviteLink"
            />
            <RoomFiltersStage
              v-else-if="roomStage === 'FILTERS'"
              :session-id="activeSession.sessionId"
              @preferences-saved="handlePreferencesSaved"
            />
            <RoomWaitingPartnerFiltersStage
              v-else-if="roomStage === 'WAITING_PARTNER_FILTERS'"
            />
            <RoomChoosingStage
              v-else-if="roomStage === 'CHOOSING'"
              :is-restarting="isCreating"
              :restart-error="error"
              :session-id="activeSession.sessionId"
              @match-created="applyMatchedMovie"
              @restart-requested="handleRestartRequested"
            />
            <RoomMatchedStage
              v-else-if="roomStage === 'MATCHED'"
              :movie="selectionState?.matchedMovie ?? null"
            />
            <RoomFinishedStage
              v-else-if="roomStage === 'CLOSED'"
              @create-new-room="goHome"
            />
          </div>
        </Transition>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { RoomStage } from '~/services/api/selection'

const STAGE_STATUS_LABELS: Record<RoomStage, string> = {
  CHOOSING: 'выбор',
  CLOSED: 'закрыто',
  FILTERS: 'фильтры',
  MATCHED: 'совпадение',
  WAITING: 'ожидание',
  WAITING_PARTNER_FILTERS: 'ожидание фильтров',
}
const STAGE_BADGE_VARIANTS: Record<
  RoomStage,
  'accent' | 'muted' | 'success' | 'warning'
> = {
  CHOOSING: 'success',
  CLOSED: 'warning',
  FILTERS: 'success',
  MATCHED: 'success',
  WAITING: 'accent',
  WAITING_PARTNER_FILTERS: 'accent',
}
const STAGE_TITLES: Record<RoomStage, string> = {
  CHOOSING: 'Выбираем фильм',
  CLOSED: 'Сессия закрыта',
  FILTERS: 'Настраиваем подборку',
  MATCHED: 'Есть совпадение',
  WAITING: 'Ждём второго участника',
  WAITING_PARTNER_FILTERS: 'Ждём фильтры партнёра',
}
const STAGE_DESCRIPTIONS: Record<RoomStage, string> = {
  CHOOSING: 'Подборка готова. Оценивайте фильмы, чтобы найти общий вариант.',
  CLOSED: 'Комната закрыта. Можно начать заново и собрать новую подборку.',
  FILTERS:
    'Выберите жанры, исключения, рейтинг и годы, чтобы настроить подборку под ваш вечер.',
  MATCHED: '',
  WAITING:
    'Приглашение готово. Отправьте ссылку, чтобы начать выбирать фильм вместе.',
  WAITING_PARTNER_FILTERS:
    'Настройки сохранены. Скоро можно будет перейти к выбору фильмов.',
}

const route = useRoute()
const {
  error,
  isCreating,
  isLoadingCurrent,
  loadCurrentRoom,
  restartRoom,
  session,
} = useRoomSession()

const sessionId = computed(() => String(route.params.sessionId ?? ''))
const activeSession = computed(() =>
  session.value?.sessionId === sessionId.value ? session.value : null,
)
const {
  applyMatchedMovie,
  isLoadingSelectionState,
  loadSelectionState,
  resetRoomStage,
  roomStage,
  selectionState,
} = useRoomStage(activeSession)
const { error: realtimeError } = useRoomRealtime(sessionId, {
  onMatchCreated: applyMatchedMovie,
  onSelectionStateChanged: () => {
    void loadSelectionState()
  },
})
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
const isResolvingTerminalStage = computed(
  () =>
    Boolean(activeSession.value) &&
    isLoadingSelectionState.value &&
    roomStage.value === null,
)
const roomLoaderLabel = computed(() => {
  if (!isResolvingTerminalStage.value) {
    return 'Возвращаем вас к выбору...'
  }

  return activeSession.value?.status === 'COMPLETED'
    ? 'Загружаем итоговый фильм...'
    : 'Проверяем состояние комнаты...'
})
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
    return 'Комната недоступна'
  }

  return roomStage.value ? STAGE_TITLES[roomStage.value] : 'Проверяем комнату'
})
const pageDescription = computed(() => {
  if (isRecoveringCurrentRoom.value) {
    return 'Пробуем вернуть вас к последнему выбору.'
  }

  if (isRoomUnavailable.value) {
    return 'Откройте актуальную ссылку приглашения или создайте новую комнату.'
  }

  if (roomStage.value === 'CHOOSING') {
    return ''
  }

  return roomStage.value
    ? STAGE_DESCRIPTIONS[roomStage.value]
    : 'Проверяем подборку.'
})

useHead({
  title: pageTitle,
  titleTemplate: 'Movie Match | %s',
})

const roomUnavailableMessage = computed(
  () =>
    error.value ??
    'Не удалось открыть эту комнату. Попробуйте актуальную ссылку приглашения или начните заново.',
)
const inviteLink = computed(() => activeSession.value?.inviteLink ?? '')
const roomContentKey = computed(() => roomStage.value ?? 'room-pending')

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

const handleRestartRequested = async () => {
  if (isCreating.value) {
    return
  }

  try {
    const createdSession = await restartRoom(activeSession.value?.sessionId)

    if (createdSession) {
      await navigateTo(`/room/${createdSession.sessionId}`)
    }
  } catch {
    // The composable exposes a user-facing error message.
  }
}

watch(sessionId, () => {
  hasCheckedCurrentRoom.value = Boolean(activeSession.value)
  resetRoomStage()
  void ensureCurrentRoom()
})

onMounted(() => {
  void ensureCurrentRoom()
})
</script>
