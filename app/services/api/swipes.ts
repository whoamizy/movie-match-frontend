import type { AxiosInstance } from 'axios'

export type SwipeDecision = 'like' | 'dislike'

export interface CreateSwipePayload {
  movieId: string
  decision: SwipeDecision
}

export interface SwipeResponse {
  swipeId: string
}

export const createSwipesApi = (api: AxiosInstance) => ({
  async createSwipe(sessionId: string, payload: CreateSwipePayload) {
    const response = await api.post<SwipeResponse>(
      `/sessions/${encodeURIComponent(sessionId)}/swipes`,
      payload,
    )

    return response.data
  },
})

export type SwipesApi = ReturnType<typeof createSwipesApi>
