<template>
  <form
    class="flex flex-col gap-4 sm:gap-5"
    @submit.prevent="submitPreferences"
  >
    <section
      class="p-3 border border-border rounded-md bg-secondary flex flex-col gap-4 sm:p-4"
    >
      <div class="flex flex-col gap-1">
        <UiBadge variant="muted" size="sm"> Жанры </UiBadge>
      </div>

      <div
        v-if="isLoadingGenres"
        class="p-3 border border-border rounded-md bg-muted"
        aria-busy="true"
        aria-live="polite"
      >
        <div class="rounded-md bg-border/70 h-10 w-full animate-pulse" />
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

      <div v-else class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <div class="flex gap-3 items-center justify-between">
            <span class="text-sm text-foreground font-medium">
              Хочется видеть
            </span>
            <span class="text-xs text-muted-foreground">
              {{ selectedGenres.length }}/{{ MAX_SELECTED_GENRES }}
            </span>
          </div>
          <div
            class="pb-2 flex gap-2 min-w-0 overflow-x-auto"
            aria-label="Предпочитаемые жанры"
          >
            <UiChips
              v-for="genre in genres"
              :key="`preferred-${genre.id}`"
              :selected="isPreferredGenreSelected(genre)"
              :disabled="isPreferredGenreDisabled(genre)"
              :value="genre.name"
              @click="togglePreferredGenre(genre)"
            >
              {{ genre.name }}
            </UiChips>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex gap-3 items-center justify-between">
            <span class="text-sm text-foreground font-medium">
              Не показывать
            </span>
            <span class="text-xs text-muted-foreground">
              {{ excludedGenres.length }}/{{ MAX_EXCLUDED_GENRES }}
            </span>
          </div>
          <div
            class="pb-2 flex gap-2 min-w-0 overflow-x-auto"
            aria-label="Исключаемые жанры"
          >
            <UiChips
              v-for="genre in genres"
              :key="`excluded-${genre.id}`"
              :selected="isExcludedGenreSelected(genre)"
              :disabled="isExcludedGenreDisabled(genre)"
              :value="genre.name"
              @click="toggleExcludedGenre(genre)"
            >
              {{ genre.name }}
            </UiChips>
          </div>
        </div>
      </div>

      <p
        v-if="selectedGenres.length >= MAX_SELECTED_GENRES"
        class="text-xs text-primary"
      >
        Выбрано максимум любимых жанров: {{ MAX_SELECTED_GENRES }}.
      </p>
      <p
        v-if="excludedGenres.length >= MAX_EXCLUDED_GENRES"
        class="text-xs text-primary"
      >
        Выбрано максимум исключений: {{ MAX_EXCLUDED_GENRES }}.
      </p>
    </section>

    <section
      class="p-3 border border-border rounded-md bg-secondary flex flex-col gap-4 sm:p-4"
    >
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      >
        <div class="flex flex-col gap-1">
          <UiBadge variant="muted" size="sm"> Минимальная оценка </UiBadge>
        </div>
        <span
          class="text-sm text-primary leading-none font-bold px-3 py-2 text-center border border-primary/45 rounded-full bg-primary/10 min-w-13 w-fit"
        >
          {{ minRating.toFixed(1) }}
        </span>
      </div>
      <!-- eslint-disable vue/html-self-closing -->
      <input
        v-model.number="minRating"
        class="accent-primary w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
        type="range"
        min="0"
        max="10"
        step="0.5"
        aria-label="Минимальная оценка"
      />
      <!-- eslint-enable vue/html-self-closing -->
    </section>

    <section
      class="p-3 border border-border rounded-md bg-secondary flex flex-col gap-4 sm:p-4"
    >
      <div class="flex flex-col gap-1">
        <UiBadge variant="muted" size="sm"> Годы выпуска </UiBadge>
      </div>

      <label class="text-sm text-foreground flex flex-col gap-2 sm:max-w-64">
        <span>Показывать фильмы с года</span>
        <UiInput
          v-model="releaseYearFrom"
          type="number"
          inputmode="numeric"
          numeric
          :min="MIN_RELEASE_YEAR"
          :max="CURRENT_RELEASE_YEAR"
          :invalid="isReleaseYearErrorVisible"
          required
          placeholder="2000"
        />
      </label>

      <p v-if="releaseYearError" class="text-xs text-primary" role="alert">
        {{ releaseYearError }}
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
      {{ isSubmittingPreferences ? 'Сохраняем фильтры...' : 'Начать выбирать' }}
    </UiButton>
  </form>
</template>

<script setup lang="ts">
import { normalizeApiError } from '~/services/api/errors'
import type { MovieGenre } from '~/services/api/movies'

const GENRES_ERROR_MESSAGE =
  'Не удалось загрузить жанры. Проверь соединение и попробуй ещё раз.'
const PREFERENCES_ERROR_MESSAGE =
  'Не удалось сохранить фильтры. Проверь соединение и попробуй ещё раз.'
const MAX_SELECTED_GENRES = 12
const MAX_EXCLUDED_GENRES = 3
const MIN_RELEASE_YEAR = 1888
const CURRENT_RELEASE_YEAR = new Date().getFullYear()
const DEFAULT_MIN_RATING = 5

const props = defineProps<{
  sessionId: string
}>()

const emit = defineEmits<{
  preferencesSaved: []
}>()

const { $moviesApi, $preferencesApi } = useNuxtApp()
const genres = ref<MovieGenre[]>([])
const selectedGenres = ref<MovieGenre[]>([])
const excludedGenres = ref<MovieGenre[]>([])
const minRating = ref(DEFAULT_MIN_RATING)
const releaseYearFrom = ref('')
const isLoadingGenres = ref(false)
const isSubmittingPreferences = ref(false)
const genresError = ref<string | null>(null)
const preferencesError = ref<string | null>(null)

const releaseYearFromNumber = computed(() =>
  parseReleaseYear(releaseYearFrom.value),
)
const isReleaseYearFromInvalid = computed(() => {
  if (releaseYearFrom.value.length === 0) {
    return true
  }

  const year = releaseYearFromNumber.value

  return year === null || year < MIN_RELEASE_YEAR || year > CURRENT_RELEASE_YEAR
})
const isReleaseYearValid = computed(() => !isReleaseYearFromInvalid.value)
const isReleaseYearErrorVisible = computed(
  () => releaseYearFrom.value.length > 0 && isReleaseYearFromInvalid.value,
)
const releaseYearError = computed(() => {
  if (!releaseYearFrom.value) {
    return ''
  }

  const year = releaseYearFromNumber.value

  if (year === null) {
    return 'Укажи год числом.'
  }

  if (year < MIN_RELEASE_YEAR) {
    return `Год должен быть не меньше ${MIN_RELEASE_YEAR}.`
  }

  if (year > CURRENT_RELEASE_YEAR) {
    return `Год не должен быть больше ${CURRENT_RELEASE_YEAR}.`
  }

  return ''
})
const canStartChoosing = computed(
  () =>
    selectedGenres.value.length > 0 &&
    selectedGenres.value.length <= MAX_SELECTED_GENRES &&
    excludedGenres.value.length <= MAX_EXCLUDED_GENRES &&
    !hasGenreOverlap.value &&
    isReleaseYearValid.value &&
    !genresError.value,
)
const hasGenreOverlap = computed(() => {
  const preferredGenreIds = new Set(
    selectedGenres.value.map((genre) => genre.id),
  )

  return excludedGenres.value.some((genre) => preferredGenreIds.has(genre.id))
})

const parseReleaseYear = (value: string) => {
  if (!/^\d+$/.test(value)) {
    return null
  }

  return Number(value)
}

const hasGenre = (collection: MovieGenre[], genre: MovieGenre) =>
  collection.some((selectedGenre) => selectedGenre.id === genre.id)

const removeGenre = (collection: MovieGenre[], genre: MovieGenre) =>
  collection.filter((selectedGenre) => selectedGenre.id !== genre.id)

const isPreferredGenreSelected = (genre: MovieGenre) =>
  hasGenre(selectedGenres.value, genre)

const isExcludedGenreSelected = (genre: MovieGenre) =>
  hasGenre(excludedGenres.value, genre)

const isPreferredGenreDisabled = (genre: MovieGenre) =>
  isSubmittingPreferences.value ||
  (selectedGenres.value.length >= MAX_SELECTED_GENRES &&
    !isPreferredGenreSelected(genre))

const isExcludedGenreDisabled = (genre: MovieGenre) =>
  isSubmittingPreferences.value ||
  (excludedGenres.value.length >= MAX_EXCLUDED_GENRES &&
    !isExcludedGenreSelected(genre))

const togglePreferredGenre = (genre: MovieGenre) => {
  preferencesError.value = null

  if (isPreferredGenreSelected(genre)) {
    selectedGenres.value = removeGenre(selectedGenres.value, genre)
    return
  }

  if (selectedGenres.value.length >= MAX_SELECTED_GENRES) {
    return
  }

  excludedGenres.value = removeGenre(excludedGenres.value, genre)
  selectedGenres.value = [...selectedGenres.value, genre]
}

const toggleExcludedGenre = (genre: MovieGenre) => {
  preferencesError.value = null

  if (isExcludedGenreSelected(genre)) {
    excludedGenres.value = removeGenre(excludedGenres.value, genre)
    return
  }

  if (excludedGenres.value.length >= MAX_EXCLUDED_GENRES) {
    return
  }

  selectedGenres.value = removeGenre(selectedGenres.value, genre)
  excludedGenres.value = [...excludedGenres.value, genre]
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
  if (!props.sessionId || !canStartChoosing.value) {
    return
  }

  const releaseYear = releaseYearFromNumber.value

  if (releaseYear === null) {
    return
  }

  isSubmittingPreferences.value = true
  preferencesError.value = null

  try {
    await $preferencesApi.updatePreferences(props.sessionId, {
      genreIds: selectedGenres.value.map((genre) => genre.id),
      excludedGenreIds: excludedGenres.value.map((genre) => genre.id),
      minRating: minRating.value,
      releaseYearFrom: releaseYear,
    })

    emit('preferencesSaved')
  } catch (cause) {
    const apiError = normalizeApiError(cause, PREFERENCES_ERROR_MESSAGE)

    preferencesError.value = apiError.message
  } finally {
    isSubmittingPreferences.value = false
  }
}

const resetPreferencesForm = () => {
  selectedGenres.value = []
  excludedGenres.value = []
  minRating.value = DEFAULT_MIN_RATING
  releaseYearFrom.value = ''
  preferencesError.value = null
}

watch(
  () => props.sessionId,
  () => {
    resetPreferencesForm()
  },
)

onMounted(() => {
  void loadGenres()
})
</script>
