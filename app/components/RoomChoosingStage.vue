<template>
  <section
    class="p-3 border border-border rounded-md bg-secondary flex flex-col gap-4 w-full sm:p-4"
    role="status"
    aria-live="polite"
  >
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

    <div v-else-if="currentMovie" class="flex flex-col gap-4 w-full">
      <article
        class="text-card-foreground px-4 py-5 border border-border rounded-md bg-card flex flex-col gap-4 w-full sm:px-6"
      >
        <div class="mx-auto max-w-xs w-full sm:max-w-sm">
          <!-- eslint-disable vue/html-self-closing -->
          <img
            v-if="currentMovie.posterUrl"
            class="border border-border rounded-md w-full block object-cover movie-poster-frame"
            :src="currentMovie.posterUrl"
            :alt="`Постер фильма ${currentMovie.title}`"
          />
          <!-- eslint-enable vue/html-self-closing -->
          <div
            v-else
            class="text-sm text-muted-foreground px-6 text-center border border-border rounded-md bg-muted flex w-full items-center justify-center movie-poster-frame"
          >
            Постер недоступен
          </div>
        </div>

        <div class="text-center flex flex-col gap-3">
          <h3 class="text-2xl heading">
            {{ currentMovie.title }}
          </h3>
          <UiButton
            type="button"
            class="mx-auto w-full sm:w-fit"
            :aria-expanded="isDetailsShown"
            @click="isDetailsShown = !isDetailsShown"
          >
            {{ isDetailsShown ? 'Скрыть' : 'Показать больше' }}
          </UiButton>
        </div>

        <div
          v-if="isDetailsShown"
          class="pt-4 border-t border-border flex flex-col gap-4"
        >
          <p class="text-sm text-foreground">
            {{ movieDescription }}
          </p>

          <dl class="text-sm gap-3 grid sm:grid-cols-2">
            <div class="px-3 py-2 rounded-md bg-muted">
              <dt class="text-muted-foreground">Рейтинг</dt>
              <dd class="text-foreground font-medium">
                {{ movieRating }}
              </dd>
            </div>
            <div class="px-3 py-2 rounded-md bg-muted">
              <dt class="text-muted-foreground">Год выпуска</dt>
              <dd class="text-foreground font-medium">
                {{ movieReleaseYear }}
              </dd>
            </div>
          </dl>

          <div class="flex flex-col gap-2">
            <span class="text-sm text-muted-foreground">Жанры</span>
            <ul v-if="currentMovie.genres.length" class="flex flex-wrap gap-2">
              <li v-for="genre in currentMovie.genres" :key="genre">
                <UiBadge variant="success" size="sm" :uppercase="false">
                  {{ genre }}
                </UiBadge>
              </li>
            </ul>
            <span v-else class="text-sm text-foreground">
              Жанры пока недоступны
            </span>
          </div>
        </div>
      </article>

      <div class="flex gap-3 justify-center">
        <UiButton
          type="button"
          class="p-0 h-12 w-12 !text-choice-dislike-foreground !bg-choice-dislike hover:!bg-choice-dislike-hover"
          aria-label="Дизлайк"
          :aria-busy="isSubmittingSwipe"
          :disabled="isSubmittingSwipe"
          @click="submitSwipe('dislike')"
        >
          <UiIcon name="dislike" size="22" />
        </UiButton>
        <UiButton
          type="button"
          class="p-0 h-12 w-12 !text-choice-like-foreground !bg-choice-like hover:!bg-choice-like-hover"
          aria-label="Лайк"
          :aria-busy="isSubmittingSwipe"
          :disabled="isSubmittingSwipe"
          @click="submitSwipe('like')"
        >
          <UiIcon name="like" size="22" />
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
const isDetailsShown = ref(false)
const isLoadingMovie = ref(false)
const isSubmittingSwipe = ref(false)
const swipeError = ref<string | null>(null)
let requestId = 0

const movieDescription = computed(
  () => currentMovie.value?.description || 'Описание пока недоступно',
)
const movieRating = computed(() => {
  const rating = currentMovie.value?.rating

  return rating === null || rating === undefined
    ? 'Рейтинг пока недоступен'
    : rating
})
const movieReleaseYear = computed(
  () => currentMovie.value?.releaseYear ?? 'Год выпуска пока недоступен',
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
  isDetailsShown.value = false
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
