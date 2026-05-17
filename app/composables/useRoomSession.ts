import { normalizeApiError } from '~/services/api/errors'
import type { SessionResponse } from '~/services/api/sessions'

const INVITE_LINK_STORAGE_PREFIX = 'movie-match:invite-link:'
const CREATE_ROOM_ERROR_MESSAGE =
  'Не удалось создать комнату. Проверь, что backend запущен, и попробуй ещё раз.'
const JOIN_ROOM_ERROR_MESSAGE =
  'Не удалось подключиться к комнате. Проверь ссылку и попробуй ещё раз.'
const CURRENT_ROOM_ERROR_MESSAGE =
  'Не удалось восстановить текущую комнату. Войди по ссылке приглашения ещё раз.'
const READY_SESSION_STATUS = 'READY'

export const useRoomSession = () => {
  const { $sessionsApi } = useNuxtApp()
  const session = useState<SessionResponse | null>('room-session', () => null)
  const participantsCount = useState<number | null>(
    'room-participants-count',
    () => null,
  )
  const isCreating = useState('room-is-creating', () => false)
  const isJoining = useState('room-is-joining', () => false)
  const isLoadingCurrent = useState('room-is-loading-current', () => false)
  const error = useState<string | null>('room-error', () => null)
  const isServiceReady = computed(
    () => session.value?.status === READY_SESSION_STATUS,
  )

  const getInviteLinkStorageKey = (sessionId: string) =>
    `${INVITE_LINK_STORAGE_PREFIX}${sessionId}`

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

  const applySession = (nextSession: SessionResponse) => {
    session.value = nextSession
    participantsCount.value =
      nextSession.status === READY_SESSION_STATUS ? 2 : 1
    saveInviteLink(nextSession.sessionId, nextSession.inviteLink)
  }

  const createRoom = async () => {
    if (isCreating.value) {
      return session.value
    }

    isCreating.value = true
    error.value = null

    try {
      const createdSession = await $sessionsApi.createSession({})

      applySession(createdSession)

      return createdSession
    } catch (cause) {
      const apiError = normalizeApiError(cause, CREATE_ROOM_ERROR_MESSAGE)

      error.value = apiError.message
      throw apiError
    } finally {
      isCreating.value = false
    }
  }

  const joinRoom = async (inviteCode: string) => {
    if (isJoining.value) {
      return session.value
    }

    isJoining.value = true
    error.value = null

    try {
      const joinedSession = await $sessionsApi.joinSession(inviteCode, {})

      applySession(joinedSession)

      return joinedSession
    } catch (cause) {
      const apiError = normalizeApiError(cause, JOIN_ROOM_ERROR_MESSAGE)

      error.value = apiError.message
      throw apiError
    } finally {
      isJoining.value = false
    }
  }

  const loadCurrentRoom = async () => {
    if (isLoadingCurrent.value) {
      return session.value
    }

    isLoadingCurrent.value = true
    error.value = null

    try {
      const currentSession = await $sessionsApi.getCurrentSession()

      applySession(currentSession)

      return currentSession
    } catch (cause) {
      const apiError = normalizeApiError(cause, CURRENT_ROOM_ERROR_MESSAGE)

      session.value = null
      participantsCount.value = null
      error.value = apiError.message
      throw apiError
    } finally {
      isLoadingCurrent.value = false
    }
  }

  const updateSessionStatus = (status: string) => {
    if (!session.value || session.value.status === status) {
      return
    }

    session.value = {
      ...session.value,
      status,
    }
  }

  const updateParticipantsCount = (nextParticipantsCount: number) => {
    participantsCount.value = nextParticipantsCount
  }

  return {
    createRoom,
    error,
    getStoredInviteLink,
    isCreating,
    isJoining,
    isLoadingCurrent,
    isServiceReady,
    joinRoom,
    loadCurrentRoom,
    participantsCount,
    saveInviteLink,
    session,
    updateParticipantsCount,
    updateSessionStatus,
  }
}
