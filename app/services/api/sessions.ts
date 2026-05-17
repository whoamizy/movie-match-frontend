import type { AxiosInstance } from 'axios'

export interface SessionParticipantResponse {
  id: string
  nickname: string | null
}

export interface SessionResponse {
  sessionId: string
  inviteCode: string
  inviteLink: string
  status: string
  participant: SessionParticipantResponse
  participantToken: string
}

export interface CreateSessionPayload {
  nickname?: string
}

export type JoinSessionPayload = CreateSessionPayload

export const createSessionsApi = (api: AxiosInstance) => ({
  async createSession(payload: CreateSessionPayload = {}) {
    const response = await api.post<SessionResponse>('/sessions', payload)

    return response.data
  },

  async joinSession(inviteCode: string, payload: JoinSessionPayload = {}) {
    const response = await api.post<SessionResponse>(
      `/sessions/${encodeURIComponent(inviteCode)}/join`,
      payload,
    )

    return response.data
  },
})

export type SessionsApi = ReturnType<typeof createSessionsApi>
