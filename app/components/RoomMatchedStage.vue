<template>
  <section
    class="p-4 border border-accent/45 rounded-md bg-accent/10 flex flex-col gap-4 w-full sm:p-5"
    role="status"
    aria-live="polite"
  >
    <UiBadge variant="success" size="sm"> совпадение </UiBadge>

    <article
      v-if="movie"
      class="text-card-foreground p-4 border border-border rounded-md bg-card flex flex-col gap-4 w-full sm:p-5"
    >
      <div class="gap-4 grid sm:grid-cols-[minmax(0,12rem)_1fr] sm:items-start">
        <div class="mx-auto max-w-48 w-full sm:mx-0">
          <!-- eslint-disable vue/html-self-closing -->
          <img
            v-if="movie.posterUrl"
            class="border border-border rounded-md w-full block object-cover movie-poster-frame"
            :src="movie.posterUrl"
            :alt="`Постер фильма ${movie.title}`"
          />
          <!-- eslint-enable vue/html-self-closing -->
          <div
            v-else
            class="text-sm text-muted-foreground px-5 text-center border border-border rounded-md bg-muted flex w-full items-center justify-center movie-poster-frame"
          >
            Постер недоступен
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <h2 class="text-2xl heading">
              {{ movie.title }}
            </h2>
            <p v-if="movie.originalTitle" class="text-sm text-muted-foreground">
              {{ movie.originalTitle }}
            </p>
          </div>

          <p class="text-sm text-foreground">
            {{ movieDescription }}
          </p>

          <dl class="text-sm gap-3 grid sm:grid-cols-3">
            <div class="px-3 py-2 rounded-md bg-muted">
              <dt class="text-muted-foreground">Рейтинг</dt>
              <dd class="text-foreground font-medium">
                {{ movieRating }}
              </dd>
            </div>
            <div class="px-3 py-2 rounded-md bg-muted">
              <dt class="text-muted-foreground">Год</dt>
              <dd class="text-foreground font-medium">
                {{ movieReleaseYear }}
              </dd>
            </div>
            <div class="px-3 py-2 rounded-md bg-muted">
              <dt class="text-muted-foreground">Длительность</dt>
              <dd class="text-foreground font-medium">
                {{ movieDuration }}
              </dd>
            </div>
          </dl>

          <div class="flex flex-col gap-2">
            <span class="text-sm text-muted-foreground">Жанры</span>
            <ul v-if="movie.genres.length" class="flex flex-wrap gap-2">
              <li v-for="genre in movie.genres" :key="genre">
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
      </div>
    </article>

    <div
      v-else
      class="p-4 border border-border rounded-md bg-card flex flex-col gap-2"
    >
      <h2 class="text-2xl heading">Есть общий фильм</h2>
      <p class="text-sm text-muted-foreground">
        Совпадение найдено, но карточка фильма пока недоступна. Попробуйте
        обновить состояние комнаты чуть позже.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { MovieCardResponse } from '~/services/api/movies'

const props = defineProps<{
  movie: MovieCardResponse | null
}>()

const movieDescription = computed(
  () => props.movie?.description || 'Описание пока недоступно',
)
const movieRating = computed(() => {
  const rating = props.movie?.rating

  return rating === null || rating === undefined
    ? 'Рейтинг пока недоступен'
    : rating
})
const movieReleaseYear = computed(
  () => props.movie?.releaseYear ?? 'Год пока недоступен',
)
const movieDuration = computed(() => {
  const duration = props.movie?.durationMinutes

  return duration === null || duration === undefined
    ? 'Время пока недоступно'
    : `${duration} мин`
})
</script>
