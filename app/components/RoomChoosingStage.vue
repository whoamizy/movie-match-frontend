<template>
  <section
    class="p-5 border border-accent/45 rounded-md bg-accent/10 flex flex-col gap-3"
    role="status"
    aria-live="polite"
  >
    <UiBadge variant="success" size="sm"> выбор фильма </UiBadge>
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl heading">Ответ backend</h2>
      <p class="text-sm text-foreground">
        Фильтры обоих участников сохранены. Запрашиваем следующий фильм для
        текущего участника.
      </p>
    </div>

    <div
      v-if="isLoadingMovie"
      class="p-3 border border-border rounded-md bg-muted"
      aria-busy="true"
    >
      <div class="rounded-md bg-border/70 h-5 w-full animate-pulse" />
    </div>

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
      По этим фильтрам фильмы закончились. Измените фильтры, чтобы продолжить
      подбор.
    </p>

    <pre
      v-else
      class="text-xs text-foreground m-0 p-4 border border-border rounded-md bg-muted max-h-96 whitespace-pre-wrap break-words overflow-auto"
      v-text="movieResponse"
    />
  </section>
</template>

<script setup lang="ts">
import { normalizeApiError } from '~/services/api/errors'
import type { MovieCardResponse } from '~/services/api/movies'

const props = defineProps<{
  sessionId: string
}>()

const { $moviesApi } = useNuxtApp()
const currentMovie = ref<MovieCardResponse | null>(null)
const error = ref<string | null>(null)
const isExhausted = ref(false)
const isLoadingMovie = ref(false)
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
      'Не удалось получить следующий фильм.',
    ).message
  } finally {
    if (activeRequestId === requestId) {
      isLoadingMovie.value = false
    }
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
