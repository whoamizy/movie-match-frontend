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
          v-else-if="activeSession && !isActiveSessionClosed"
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
          v-if="activeSession && isActiveSessionReady && !isActiveSessionClosed"
          class="flex flex-col gap-5"
        >
          <div
            v-if="arePreferencesReady"
            class="p-5 border border-accent/45 rounded-md bg-accent/10 flex flex-col gap-3"
            role="status"
            aria-live="polite"
          >
            <UiBadge variant="success" size="sm"> фильтры готовы </UiBadge>
            <div class="flex flex-col gap-2">
              <h2 class="text-2xl heading">Можно переходить к выбору</h2>
              <p class="text-sm text-foreground">
                Предпочтения сохранены. Скоро здесь появятся карточки фильмов
                для лайков и дизлайков.
              </p>
            </div>
          </div>

          <form
            v-else
            class="flex flex-col gap-4 sm:gap-5"
            @submit.prevent="submitPreferences"
          >
            <section
              class="p-3 border border-border rounded-md bg-secondary flex flex-col gap-4 sm:p-4"
            >
              <div class="flex flex-col gap-1">
                <UiBadge variant="muted" size="sm"> Жанры </UiBadge>
                <p class="text-sm text-muted-foreground">
                  Выбери до {{ MAX_SELECTED_GENRES }} жанров, которые хочется
                  видеть в подборке.
                </p>
              </div>

              <div
                v-if="isLoadingGenres"
                class="p-3 border border-border rounded-md bg-muted"
                aria-busy="true"
                aria-live="polite"
              >
                <div
                  class="rounded-md bg-border/70 h-10 w-full animate-pulse"
                />
              </div>

              <div
                v-else-if="genresError"
                class="p-4 border border-primary/35 rounded-md bg-primary/10 flex flex-col gap-3"
                role="alert"
              >
                <p class="text-sm text-primary">
                  {{ genresError }}
                </p>
                <UiButton
                  type="button"
                  class="w-full sm:w-fit"
                  :disabled="isLoadingGenres"
                  @click="loadGenres"
                >
                  Загрузить жанры ещё раз
                </UiButton>
              </div>

              <div
                v-else
                class="pb-2 flex gap-2 min-w-0 overflow-x-auto"
                aria-label="Список жанров"
              >
                <UiChips
                  v-for="genre in genres"
                  :key="getGenreKey(genre)"
                  :selected="isGenreSelected(genre)"
                  :disabled="isGenreDisabled(genre)"
                  :value="genre.name"
                  @click="toggleGenre(genre)"
                >
                  {{ genre.name }}
                </UiChips>
              </div>

              <p
                v-if="selectedGenres.length >= MAX_SELECTED_GENRES"
                class="text-xs text-primary"
              >
                Выбрано максимум жанров: {{ MAX_SELECTED_GENRES }}.
              </p>
            </section>

            <section
              class="p-3 border border-border rounded-md bg-secondary flex flex-col gap-4 sm:p-4"
            >
              <div
                class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div class="flex flex-col gap-1">
                  <UiBadge variant="muted" size="sm">
                    Минимальная оценка
                  </UiBadge>
                  <p class="text-sm text-muted-foreground">
                    Отсечём фильмы ниже выбранного рейтинга.
                  </p>
                </div>
                <span
                  class="text-sm text-primary leading-none font-bold px-3 py-2 text-center border border-primary/45 rounded-full bg-primary/10 min-w-13 w-fit"
                >
                  {{ minRating.toFixed(1) }}
                </span>
              </div>
              <input
                v-model.number="minRating"
                class="accent-primary w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
                type="range"
                min="0"
                max="10"
                step="0.5"
                aria-label="Минимальная оценка"
              />
            </section>

            <section
              class="p-3 border border-border rounded-md bg-secondary flex flex-col gap-4 sm:p-4"
            >
              <div class="flex flex-col gap-1">
                <UiBadge variant="muted" size="sm"> Годы выпуска </UiBadge>
                <p class="text-sm text-muted-foreground">
                  Укажи диапазон с {{ MIN_RELEASE_YEAR }} по
                  {{ MAX_RELEASE_YEAR }} год.
                </p>
              </div>

              <div class="gap-3 grid grid-cols-1 sm:grid-cols-2">
                <label class="text-sm text-foreground flex flex-col gap-2">
                  <span>От</span>
                  <UiInput
                    v-model="releaseYearFrom"
                    type="number"
                    inputmode="numeric"
                    numeric
                    :min="MIN_RELEASE_YEAR"
                    :invalid="isReleaseYearFromInvalid"
                    placeholder="1888"
                  />
                </label>
                <label class="text-sm text-foreground flex flex-col gap-2">
                  <span>До</span>
                  <UiInput
                    v-model="releaseYearTo"
                    type="number"
                    inputmode="numeric"
                    numeric
                    :max="MAX_RELEASE_YEAR"
                    :invalid="isReleaseYearToInvalid"
                    placeholder="2100"
                  />
                </label>
              </div>

              <p
                v-if="releaseYearsError"
                class="text-xs text-primary"
                role="alert"
              >
                {{ releaseYearsError }}
              </p>
            </section>

            <p
              v-if="preferencesError"
              class="text-sm text-primary px-4 py-3 border border-primary/35 rounded-md bg-primary/10"
              role="alert"
            >
              {{ preferencesError }}
            </p>

            <UiButton
              type="submit"
              class="w-full sm:w-fit"
              :disabled="!canStartChoosing || isSubmittingPreferences"
              :aria-busy="isSubmittingPreferences"
            >
              {{
                isSubmittingPreferences
                  ? 'Сохраняем фильтры...'
                  : 'Начать выбирать'
              }}
            </UiButton>
          </form>
        </div>

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
import { normalizeApiError } from '~/services/api/errors'
import type { MovieGenre } from '~/services/api/movies'

const GENRES_ERROR_MESSAGE =
  'Не удалось загрузить жанры. Проверь соединение и попробуй ещё раз.'
const PREFERENCES_ERROR_MESSAGE =
  'Не удалось сохранить фильтры. Проверь соединение и попробуй ещё раз.'
const MAX_SELECTED_GENRES = 12
const MIN_RELEASE_YEAR = 1888
const MAX_RELEASE_YEAR = 2100
const DEFAULT_MIN_RATING = 5

const route = useRoute()
const { $moviesApi, $preferencesApi } = useNuxtApp()
const {
  error,
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
const genres = ref<MovieGenre[]>([])
const selectedGenres = ref<MovieGenre[]>([])
const minRating = ref(DEFAULT_MIN_RATING)
const releaseYearFrom = ref('')
const releaseYearTo = ref('')
const isLoadingGenres = ref(false)
const isSubmittingPreferences = ref(false)
const arePreferencesReady = ref(false)
const genresError = ref<string | null>(null)
const preferencesError = ref<string | null>(null)
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
    return 'Комната закрыта: оба участника вышли и не вернулись.'
  }

  return isActiveSessionReady.value
    ? arePreferencesReady.value
      ? 'Предпочтения сохранены. Следующий экран с карточками фильмов будет добавлен в MVP.'
      : 'Оба участника подключены. Выбери жанры, рейтинг и годы выпуска, чтобы подготовить подборку.'
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
const participantsBadgeVariant = computed(() =>
  isActiveSessionReady.value ? 'success' : 'accent',
)
const participantsStatusMessage = computed(() =>
  isActiveSessionReady.value
    ? 'Комната собрана. Осталось настроить фильтры под общий вечер.'
    : 'Ждём второго участника по ссылке приглашения.',
)
const releaseYearFromNumber = computed(() =>
  parseReleaseYear(releaseYearFrom.value),
)
const releaseYearToNumber = computed(() =>
  parseReleaseYear(releaseYearTo.value),
)
const isReleaseYearFromInvalid = computed(() => {
  if (releaseYearFrom.value.length === 0) {
    return false
  }

  const year = releaseYearFromNumber.value

  return year === null || year < MIN_RELEASE_YEAR
})
const isReleaseYearToInvalid = computed(() => {
  if (releaseYearTo.value.length === 0) {
    return false
  }

  const year = releaseYearToNumber.value

  return year === null || year > MAX_RELEASE_YEAR
})
const areReleaseYearsValid = computed(() => {
  const from = releaseYearFromNumber.value
  const to = releaseYearToNumber.value

  return (
    from !== null &&
    to !== null &&
    from >= MIN_RELEASE_YEAR &&
    to <= MAX_RELEASE_YEAR &&
    from <= to
  )
})
const releaseYearsError = computed(() => {
  if (!releaseYearFrom.value && !releaseYearTo.value) {
    return ''
  }

  const from = releaseYearFromNumber.value
  const to = releaseYearToNumber.value

  if (from === null || to === null) {
    return 'Заполни оба года числами.'
  }

  if (from < MIN_RELEASE_YEAR) {
    return `Год “от” должен быть не меньше ${MIN_RELEASE_YEAR}.`
  }

  if (to > MAX_RELEASE_YEAR) {
    return `Год “до” должен быть не больше ${MAX_RELEASE_YEAR}.`
  }

  if (from > to) {
    return 'Начальный год должен быть меньше или равен конечному.'
  }

  return ''
})
const canStartChoosing = computed(
  () =>
    selectedGenres.value.length > 0 &&
    selectedGenres.value.length <= MAX_SELECTED_GENRES &&
    areReleaseYearsValid.value &&
    !genresError.value,
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

const parseReleaseYear = (value: string) => {
  if (!/^\d+$/.test(value)) {
    return null
  }

  return Number(value)
}

const getGenreKey = (genre: MovieGenre) => genre.slug ?? genre.name

const isGenreSelected = (genre: MovieGenre) =>
  selectedGenres.value.some(
    (selectedGenre) => selectedGenre.name === genre.name,
  )

const isGenreDisabled = (genre: MovieGenre) =>
  isSubmittingPreferences.value ||
  (selectedGenres.value.length >= MAX_SELECTED_GENRES &&
    !isGenreSelected(genre))

const toggleGenre = (genre: MovieGenre) => {
  preferencesError.value = null

  if (isGenreSelected(genre)) {
    selectedGenres.value = selectedGenres.value.filter(
      (selectedGenre) => selectedGenre.name !== genre.name,
    )
    return
  }

  if (selectedGenres.value.length >= MAX_SELECTED_GENRES) {
    return
  }

  selectedGenres.value = [...selectedGenres.value, genre]
}

const loadGenres = async () => {
  if (isLoadingGenres.value) {
    return
  }

  isLoadingGenres.value = true
  genresError.value = null

  try {
    const result = await $moviesApi.getGenres()

    genres.value = result.genres
  } catch (cause) {
    const apiError = normalizeApiError(cause, GENRES_ERROR_MESSAGE)

    genresError.value = apiError.message
  } finally {
    isLoadingGenres.value = false
  }
}

const submitPreferences = async () => {
  if (!activeSession.value || !canStartChoosing.value) {
    return
  }

  isSubmittingPreferences.value = true
  preferencesError.value = null

  try {
    await $preferencesApi.updatePreferences(activeSession.value.sessionId, {
      genres: selectedGenres.value,
      minRating: minRating.value,
      releaseYearFrom: releaseYearFromNumber.value ?? undefined,
      releaseYearTo: releaseYearToNumber.value ?? undefined,
    })

    arePreferencesReady.value = true
  } catch (cause) {
    const apiError = normalizeApiError(cause, PREFERENCES_ERROR_MESSAGE)

    preferencesError.value = apiError.message
  } finally {
    isSubmittingPreferences.value = false
  }
}

const resetPreferencesForm = () => {
  selectedGenres.value = []
  minRating.value = DEFAULT_MIN_RATING
  releaseYearFrom.value = ''
  releaseYearTo.value = ''
  arePreferencesReady.value = false
  preferencesError.value = null
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
  resetPreferencesForm()
  void ensureCurrentRoom()
})

watch(
  isActiveSessionReady,
  (nextIsReady) => {
    if (!nextIsReady) {
      return
    }

    if (genres.value.length === 0 && !genresError.value) {
      void loadGenres()
    }
  },
  { immediate: true },
)

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
