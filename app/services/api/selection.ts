import type { AxiosInstance } from 'axios'
import type { MovieCardResponse } from '~/services/api/movies'
import type { PreferencesResponse } from '~/services/api/preferences'

export type RoomStage =
  | 'WAITING'
  | 'FILTERS'
  | 'WAITING_PARTNER_FILTERS'
  | 'CHOOSING'
  | 'MATCHED'
  | 'CLOSED'

export interface SelectionStateResponse {
  stage: RoomStage
  preferences: PreferencesResponse | null
  matchedMovie: MovieCardResponse | null
}

export const createSelectionApi = (api: AxiosInstance) => ({
  async getSelectionState(sessionId: string) {
    const response = await api.get<SelectionStateResponse>(
      `/sessions/${encodeURIComponent(sessionId)}/selection-state`,
    )

    return response.data
  },
})

export type SelectionApi = ReturnType<typeof createSelectionApi>
