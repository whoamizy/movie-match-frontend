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
        <p class="text-sm text-muted-foreground">
          Выбери до {{ MAX_SELECTED_GENRES }} жанров, которые хочется видеть в
          подборке.
        </p>
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

      <div
        v-else
        class="pb-2 flex gap-2 min-w-0 overflow-x-auto"
        aria-label="Список жанров"
      >
        <UiChips
          v-for="genre in genres"
          :key="genre.id"
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
          <UiBadge variant="muted" size="sm"> Минимальная оценка </UiBadge>
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
          Укажи диапазон с {{ MIN_RELEASE_YEAR }} по {{ MAX_RELEASE_YEAR }} год.
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

      <p v-if="releaseYearsError" class="text-xs text-primary" role="alert">
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
const MIN_RELEASE_YEAR = 1888
const MAX_RELEASE_YEAR = 2100
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
const minRating = ref(DEFAULT_MIN_RATING)
const releaseYearFrom = ref('')
const releaseYearTo = ref('')
const isLoadingGenres = ref(false)
const isSubmittingPreferences = ref(false)
const genresError = ref<string | null>(null)
const preferencesError = ref<string | null>(null)

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

const parseReleaseYear = (value: string) => {
  if (!/^\d+$/.test(value)) {
    return null
  }

  return Number(value)
}

const isGenreSelected = (genre: MovieGenre) =>
  selectedGenres.value.some((selectedGenre) => selectedGenre.id === genre.id)

const isGenreDisabled = (genre: MovieGenre) =>
  isSubmittingPreferences.value ||
  (selectedGenres.value.length >= MAX_SELECTED_GENRES &&
    !isGenreSelected(genre))

const toggleGenre = (genre: MovieGenre) => {
  preferencesError.value = null

  if (isGenreSelected(genre)) {
    selectedGenres.value = selectedGenres.value.filter(
      (selectedGenre) => selectedGenre.id !== genre.id,
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
  if (!props.sessionId || !canStartChoosing.value) {
    return
  }

  isSubmittingPreferences.value = true
  preferencesError.value = null

  try {
    await $preferencesApi.updatePreferences(props.sessionId, {
      genreIds: selectedGenres.value.map((genre) => genre.id),
      minRating: minRating.value,
      releaseYearFrom: releaseYearFromNumber.value ?? undefined,
      releaseYearTo: releaseYearToNumber.value ?? undefined,
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
  minRating.value = DEFAULT_MIN_RATING
  releaseYearFrom.value = ''
  releaseYearTo.value = ''
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
