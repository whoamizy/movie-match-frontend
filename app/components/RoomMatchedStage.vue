<template>
  <section
    class="p-3 border border-border rounded-md bg-secondary flex flex-col gap-4 w-full sm:p-4"
    role="status"
    aria-live="polite"
  >
    <article
      v-if="movie"
      class="text-card-foreground px-4 py-5 border border-border rounded-md bg-card flex flex-col gap-4 w-full sm:px-6"
    >
      <div class="mx-auto max-w-xs w-full sm:max-w-sm">
        <!-- eslint-disable vue/html-self-closing -->
        <img
          v-if="moviePosterUrl"
          class="border border-border rounded-md w-full block object-cover movie-poster-frame"
          :src="moviePosterUrl"
          :alt="`Постер фильма ${movie.title}`"
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
        <h2 class="text-2xl heading">
          {{ movie.title }}
        </h2>
      </div>

      <div class="pt-4 border-t border-border flex flex-col gap-4">
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
    </article>

    <div
      v-else
      class="p-4 border border-border rounded-md bg-card flex flex-col gap-2"
    >
      <h2 class="text-2xl heading">Есть общий фильм</h2>
      <p class="text-sm text-muted-foreground">
        Совпадение найдено, но карточка фильма пока не загрузилась. Попробуйте
        ещё раз чуть позже.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { MovieCardResponse } from '~/services/api/movies'
import { buildMoviePosterUrl } from '~/utils/movie-poster'

const props = defineProps<{
  movie: MovieCardResponse | null
}>()

const config = useRuntimeConfig()
const moviePosterUrl = computed(() =>
  buildMoviePosterUrl(String(config.public.apiBase), props.movie),
)
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
  () => props.movie?.releaseYear ?? 'Год выпуска пока недоступен',
)
</script>
