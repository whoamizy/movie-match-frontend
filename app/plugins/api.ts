import type { AxiosInstance } from 'axios'
import axios from 'axios'
import type { MoviesApi } from '~/services/api/movies'
import { createMoviesApi } from '~/services/api/movies'
import type { PreferencesApi } from '~/services/api/preferences'
import { createPreferencesApi } from '~/services/api/preferences'
import type { SelectionApi } from '~/services/api/selection'
import { createSelectionApi } from '~/services/api/selection'
import type { SessionsApi } from '~/services/api/sessions'
import { createSessionsApi } from '~/services/api/sessions'
import type { SwipesApi } from '~/services/api/swipes'
import { createSwipesApi } from '~/services/api/swipes'

declare module '#app' {
  interface NuxtApp {
    $api: AxiosInstance
    $moviesApi: MoviesApi
    $preferencesApi: PreferencesApi
    $selectionApi: SelectionApi
    $sessionsApi: SessionsApi
    $swipesApi: SwipesApi
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: AxiosInstance
    $moviesApi: MoviesApi
    $preferencesApi: PreferencesApi
    $selectionApi: SelectionApi
    $sessionsApi: SessionsApi
    $swipesApi: SwipesApi
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const api = axios.create({
    baseURL: config.public.apiBase,
    withCredentials: true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  return {
    provide: {
      api,
      moviesApi: createMoviesApi(api),
      preferencesApi: createPreferencesApi(api),
      selectionApi: createSelectionApi(api),
      sessionsApi: createSessionsApi(api),
      swipesApi: createSwipesApi(api),
    },
  }
})
