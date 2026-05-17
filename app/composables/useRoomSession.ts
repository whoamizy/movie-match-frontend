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

const inviteLinkStoragePrefix = 'movie-match:invite-link:'

export const useRoomSession = () => {
  const config = useRuntimeConfig()
  const session = useState<SessionResponse | null>('room-session', () => null)
  const participantToken = useState<string | null>(
    'room-participant-token',
    () => null,
  )
  const isCreating = useState('room-is-creating', () => false)
  const error = useState<string | null>('room-error', () => null)

  const getInviteLinkStorageKey = (sessionId: string) =>
    `${inviteLinkStoragePrefix}${sessionId}`

  const getStoredInviteLink = (sessionId: string) => {
    if (!sessionId) {
      return null
    }

    try {
      return window.localStorage.getItem(getInviteLinkStorageKey(sessionId))
    } catch {
      return null
    }
  }

  const saveInviteLink = (sessionId: string, inviteLink: string) => {
    if (!sessionId || !inviteLink) {
      return
    }

    try {
      window.localStorage.setItem(
        getInviteLinkStorageKey(sessionId),
        inviteLink,
      )
    } catch {
      // Persisting the invite link is a convenience; room creation should not fail.
    }
  }

  const createRoom = async () => {
    if (isCreating.value) {
      return session.value
    }

    isCreating.value = true
    error.value = null

    try {
      const createdSession = await $fetch<SessionResponse>('/sessions', {
        baseURL: config.public.apiBase,
        body: {},
        method: 'POST',
      })

      session.value = createdSession
      participantToken.value = createdSession.participantToken
      saveInviteLink(createdSession.sessionId, createdSession.inviteLink)

      return createdSession
    } catch (cause) {
      error.value =
        'Не удалось создать комнату. Проверь, что backend запущен, и попробуй ещё раз.'
      throw cause
    } finally {
      isCreating.value = false
    }
  }

  return {
    createRoom,
    error,
    getStoredInviteLink,
    isCreating,
    participantToken,
    saveInviteLink,
    session,
  }
}
