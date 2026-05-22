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
          <RoomWaitingPartnerFiltersStage
            v-else-if="roomStage === 'WAITING_PARTNER_FILTERS'"
          />
          <RoomChoosingStage
            v-else-if="roomStage === 'CHOOSING'"
            :session-id="activeSession.sessionId"
            @match-found="handleMatchFound"
          />
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
  WAITING_PARTNER_FILTERS: 'ожидание фильтров',
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
  WAITING_PARTNER_FILTERS: 'accent',
}
const STAGE_TITLES: Record<RoomStage, string> = {
  CHOOSING: 'Выбираем фильм',
  FILTERS: 'Настраиваем подборку',
  FINISHED: 'Сессия завершена',
  MATCHED: 'Есть совпадение',
  WAITING: 'Ждём второго участника',
  WAITING_PARTNER_FILTERS: 'Ждём фильтры партнёра',
}
const STAGE_DESCRIPTIONS: Record<RoomStage, string> = {
  CHOOSING:
    'Фильтры обоих участников сохранены. Backend собирает общую колоду и выдаёт следующую карточку.',
  FILTERS:
    'Оба участника подключены. Выбери любимые жанры, исключения, рейтинг и годы, чтобы подготовить общую подборку.',
  FINISHED: 'Комната закрыта: оба участника вышли и не вернулись.',
  MATCHED:
    'Найден общий фильм. Следующий шаг покажет карточку совпадения и варианты продолжения.',
  WAITING:
    'Комната создана. Как только второй участник войдёт по ссылке, можно будет перейти к выбору фильмов.',
  WAITING_PARTNER_FILTERS:
    'Твои фильтры уже сохранены. Осталось дождаться настроек второго участника.',
}

const route = useRoute()
const { error, isLoadingCurrent, loadCurrentRoom, saveInviteLink, session } =
  useRoomSession()

const sessionId = computed(() => String(route.params.sessionId ?? ''))
const activeSession = computed(() =>
  session.value?.sessionId === sessionId.value ? session.value : null,
)
const { loadSelectionState, resetRoomStage, roomStage } =
  useRoomStage(activeSession)
const { error: realtimeError } = useRoomRealtime(sessionId, {
  onSelectionStateChanged: loadSelectionState,
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

const handleMatchFound = () => {
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
