import type { AxiosInstance } from 'axios'
import axios, { AxiosHeaders } from 'axios'
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
  const participantToken = useState<string | null>(
    'room-participant-token',
    () => null,
  )
  const api = axios.create({
    baseURL: config.public.apiBase,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  api.interceptors.request.use((requestConfig) => {
    if (!participantToken.value) {
      return requestConfig
    }

    const headers =
      requestConfig.headers instanceof AxiosHeaders
        ? requestConfig.headers
        : new AxiosHeaders(requestConfig.headers)

    headers.set('Authorization', `Bearer ${participantToken.value}`)
    requestConfig.headers = headers

    return requestConfig
  })

  return {
    provide: {
      api,
      sessionsApi: createSessionsApi(api),
    },
  }
})
