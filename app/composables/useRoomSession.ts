import { normalizeApiError } from '~/services/api/errors'
import type { SessionResponse } from '~/services/api/sessions'

const inviteLinkStoragePrefix = 'movie-match:invite-link:'
const createRoomErrorMessage =
  'Не удалось создать комнату. Проверь, что backend запущен, и попробуй ещё раз.'

export const useRoomSession = () => {
  const { $sessionsApi } = useNuxtApp()
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
      const createdSession = await $sessionsApi.createSession({})

      session.value = createdSession
      participantToken.value = createdSession.participantToken
      saveInviteLink(createdSession.sessionId, createdSession.inviteLink)

      return createdSession
    } catch (cause) {
      const apiError = normalizeApiError(cause, createRoomErrorMessage)

      error.value = apiError.message
      throw apiError
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
