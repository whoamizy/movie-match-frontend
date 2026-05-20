import type { AxiosInstance } from 'axios'

export interface UpdatePreferencesPayload {
  genreIds: number[]
  minRating?: number
  releaseYearFrom?: number
  releaseYearTo?: number
}

export interface PreferencesResponse {
  id: string
  sessionId: string
  participantId: string
  genreIds: number[]
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
