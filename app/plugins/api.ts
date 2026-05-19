import type { AxiosInstance } from 'axios'
import axios from 'axios'
import type { MoviesApi } from '~/services/api/movies'
import { createMoviesApi } from '~/services/api/movies'
import type { PreferencesApi } from '~/services/api/preferences'
import { createPreferencesApi } from '~/services/api/preferences'
import type { SessionsApi } from '~/services/api/sessions'
import { createSessionsApi } from '~/services/api/sessions'

declare module '#app' {
  interface NuxtApp {
    $api: AxiosInstance
    $moviesApi: MoviesApi
    $preferencesApi: PreferencesApi
    $sessionsApi: SessionsApi
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: AxiosInstance
    $moviesApi: MoviesApi
    $preferencesApi: PreferencesApi
    $sessionsApi: SessionsApi
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
      sessionsApi: createSessionsApi(api),
    },
  }
})
