import type { AxiosInstance } from 'axios'

export interface SessionParticipantResponse {
  id: string
  isCreator: boolean
  nickname: string | null
}

export interface SessionResponse {
  sessionId: string
  inviteCode: string
  inviteLink: string
  participantsCount: number
  status: string
  participant: SessionParticipantResponse
}

export interface LeaveSessionResponse {
  participantsCount: number
  status: string
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

  async getCurrentSession() {
    const response = await api.get<SessionResponse>('/sessions/current')

    return response.data
  },

  async leaveSession(sessionId: string) {
    const response = await api.post<LeaveSessionResponse>(
      `/sessions/${encodeURIComponent(sessionId)}/leave`,
    )

    return response.data
  },
})

export type SessionsApi = ReturnType<typeof createSessionsApi>
