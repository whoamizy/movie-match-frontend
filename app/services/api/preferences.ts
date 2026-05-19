import type { AxiosInstance } from 'axios'
import type { MovieGenre } from '~/services/api/movies'

export interface UpdatePreferencesPayload {
  genres: MovieGenre[]
  minRating?: number
  releaseYearFrom?: number
  releaseYearTo?: number
}

export interface PreferencesResponse {
  id: string
  sessionId: string
  participantId: string
  genres: string[]
  minRating: number | null
  releaseYearFrom: number | null
  releaseYearTo: number | null
  createdAt: string
  updatedAt: string
}

export const createPreferencesApi = (api: AxiosInstance) => ({
  async updatePreferences(
    sessionId: string,
    payload: UpdatePreferencesPayload,
  ) {
    const response = await api.patch<PreferencesResponse>(
      `/sessions/${encodeURIComponent(sessionId)}/preferences`,
      payload,
    )

    return response.data
  },
})

export type PreferencesApi = ReturnType<typeof createPreferencesApi>
