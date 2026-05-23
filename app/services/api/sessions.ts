import type { AxiosInstance } from 'axios'

export interface SessionParticipantResponse {
  id: string
  isCreator: boolean
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

export const createSessionsApi = (api: AxiosInstance) => ({
  async createSession() {
    const response = await api.post<SessionResponse>('/sessions')

    return response.data
  },

  async joinSession(inviteCode: string) {
    const response = await api.post<SessionResponse>(
      `/sessions/${encodeURIComponent(inviteCode)}/join`,
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
