import type { AxiosInstance } from 'axios'

export interface UpdatePreferencesPayload {
  genreIds: number[]
  excludedGenreIds?: number[]
  minRating?: number
  releaseYearFrom?: number
}

export interface PreferencesResponse {
  id: string
  sessionId: string
  participantId: string
  genreIds: number[]
  excludedGenreIds: number[]
  minRating: number | null
  releaseYearFrom: number | null
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
