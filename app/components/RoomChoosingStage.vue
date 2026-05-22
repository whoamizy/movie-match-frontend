<template>
  <section
    class="p-5 border border-accent/45 rounded-md bg-accent/10 flex flex-col gap-3"
    role="status"
    aria-live="polite"
  >
    <UiBadge variant="success" size="sm"> выбор фильма </UiBadge>
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl heading">Следующий фильм</h2>
      <p class="text-sm text-foreground">
        Фильтры обоих участников сохранены. Backend готовит общую колоду и
        отдаёт карточку для текущего участника.
      </p>
    </div>

    <UiLoader v-if="isLoadingMovie" label="Готовим следующий фильм..." />

    <div
      v-else-if="error"
      class="p-4 border border-primary/35 rounded-md bg-primary/10 flex flex-col gap-3"
      role="alert"
    >
      <p class="text-sm text-primary">
        {{ error }}
      </p>
      <UiButton type="button" class="w-full sm:w-fit" @click="loadNextMovie">
        Повторить запрос
      </UiButton>
    </div>

    <p
      v-else-if="isExhausted"
      class="text-sm text-primary px-4 py-3 border border-primary/35 rounded-md bg-primary/10"
    >
      Общая подборка закончилась. Можно создать новую комнату и начать с другими
      настройками.
    </p>

    <div v-else class="flex flex-col gap-3">
      <pre
        class="text-xs text-foreground m-0 p-4 border border-border rounded-md bg-muted max-h-96 whitespace-pre-wrap break-words overflow-auto"
        v-text="movieResponse"
      />
      <div class="gap-2 grid sm:grid-cols-2">
        <UiButton
          type="button"
          :disabled="isSubmittingSwipe"
          :aria-busy="isSubmittingSwipe"
          @click="submitSwipe('dislike')"
        >
          Дизлайк
        </UiButton>
        <UiButton
          type="button"
          :disabled="isSubmittingSwipe"
          :aria-busy="isSubmittingSwipe"
          @click="submitSwipe('like')"
        >
          Лайк
        </UiButton>
      </div>
      <p
        v-if="swipeError"
        class="text-sm text-primary px-4 py-3 border border-primary/35 rounded-md bg-primary/10"
        role="alert"
      >
        {{ swipeError }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { normalizeApiError } from '~/services/api/errors'
import type { MovieCardResponse } from '~/services/api/movies'
import type { SwipeDecision } from '~/services/api/swipes'

const props = defineProps<{
  sessionId: string
}>()

const emit = defineEmits<{
  matchFound: []
}>()

const { $moviesApi, $swipesApi } = useNuxtApp()
const currentMovie = ref<MovieCardResponse | null>(null)
const error = ref<string | null>(null)
const isExhausted = ref(false)
const isLoadingMovie = ref(false)
const isSubmittingSwipe = ref(false)
const swipeError = ref<string | null>(null)
let requestId = 0

const movieResponse = computed(() =>
  JSON.stringify(currentMovie.value, null, 2),
)

const loadNextMovie = async () => {
  if (!props.sessionId) {
    return
  }

  const activeRequestId = requestId + 1
  requestId = activeRequestId
  error.value = null
  swipeError.value = null
  isExhausted.value = false
  isLoadingMovie.value = true

  try {
    const nextMovie = await $moviesApi.getNextMovie(props.sessionId)

    if (activeRequestId !== requestId) {
      return
    }

    currentMovie.value = nextMovie
    isExhausted.value = nextMovie === null
  } catch (nextMovieError) {
    if (activeRequestId !== requestId) {
      return
    }

    currentMovie.value = null
    error.value = normalizeApiError(
      nextMovieError,
      'Не удалось подготовить или получить следующий фильм.',
    ).message
  } finally {
    if (activeRequestId === requestId) {
      isLoadingMovie.value = false
    }
  }
}

const submitSwipe = async (decision: SwipeDecision) => {
  const movie = currentMovie.value

  if (!props.sessionId || !movie || isSubmittingSwipe.value) {
    return
  }

  swipeError.value = null
  isSubmittingSwipe.value = true

  try {
    const swipe = await $swipesApi.createSwipe(props.sessionId, {
      decision,
      movieId: movie.id,
    })

    currentMovie.value = null

    if (swipe.matchedMovie) {
      emit('matchFound')
      return
    }

    await loadNextMovie()
  } catch (submitSwipeError) {
    swipeError.value = normalizeApiError(
      submitSwipeError,
      'Не удалось сохранить выбор фильма.',
    ).message
  } finally {
    isSubmittingSwipe.value = false
  }
}

watch(
  () => props.sessionId,
  () => {
    void loadNextMovie()
  },
  { immediate: true },
)
</script>
