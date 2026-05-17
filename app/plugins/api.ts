import type { AxiosInstance } from 'axios'
import axios from 'axios'
import type { SessionsApi } from '~/services/api/sessions'
import { createSessionsApi } from '~/services/api/sessions'

declare module '#app' {
  interface NuxtApp {
    $api: AxiosInstance
    $sessionsApi: SessionsApi
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: AxiosInstance
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
      sessionsApi: createSessionsApi(api),
    },
  }
})
