import { normalizeApiError } from '~/services/api/errors'
import type { SessionResponse, SessionStatus } from '~/services/api/sessions'

const CREATE_ROOM_ERROR_MESSAGE =
  'Не удалось создать комнату. Проверь соединение и попробуй ещё раз.'
const JOIN_ROOM_ERROR_MESSAGE =
  'Не удалось открыть приглашение. Проверь ссылку и попробуй ещё раз.'
const CURRENT_ROOM_ERROR_MESSAGE =
  'Не удалось вернуться к комнате. Открой ссылку приглашения ещё раз.'
const LEAVE_ROOM_ERROR_MESSAGE =
  'Не удалось завершить участие. Проверь соединение и попробуй ещё раз.'
const READY_SESSION_STATUS = 'READY'
const CLOSED_SESSION_STATUS = 'CLOSED'

export const useRoomSession = () => {
  const { $sessionsApi } = useNuxtApp()
  const session = useState<SessionResponse | null>('room-session', () => null)
  const isCreating = useState('room-is-creating', () => false)
  const isJoining = useState('room-is-joining', () => false)
  const isLeaving = useState('room-is-leaving', () => false)
  const isLoadingCurrent = useState('room-is-loading-current', () => false)
  const hasLeftSession = useState('room-has-left-session', () => false)
  const error = useState<string | null>('room-error', () => null)
  const isServiceReady = computed(
    () => session.value?.status === READY_SESSION_STATUS,
  )
  const isSessionClosed = computed(
    () => session.value?.status === CLOSED_SESSION_STATUS,
  )

  const applySession = (nextSession: SessionResponse) => {
    session.value = nextSession
    hasLeftSession.value = false
  }

  const createRoom = async () => {
    if (isCreating.value) {
      return session.value
    }

    isCreating.value = true
    error.value = null

    try {
      const createdSession = await $sessionsApi.createSession()

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
      const joinedSession = await $sessionsApi.joinSession(inviteCode)

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
      error.value = apiError.message
      throw apiError
    } finally {
      isLoadingCurrent.value = false
    }
  }

  const refreshCurrentRoom = async () => {
    if (isLoadingCurrent.value) {
      return session.value
    }

    isLoadingCurrent.value = true

    try {
      const currentSession = await $sessionsApi.getCurrentSession()

      applySession(currentSession)
      error.value = null

      return currentSession
    } finally {
      isLoadingCurrent.value = false
    }
  }

  const leaveRoom = async (sessionId: string) => {
    if (!sessionId || isLeaving.value || hasLeftSession.value) {
      return session.value
    }

    isLeaving.value = true
    error.value = null

    try {
      const result = await $sessionsApi.leaveSession(sessionId)

      if (session.value?.sessionId === sessionId) {
        session.value = {
          ...session.value,
          status: result.status,
        }
      }

      hasLeftSession.value = true

      return session.value
    } catch (cause) {
      const apiError = normalizeApiError(cause, LEAVE_ROOM_ERROR_MESSAGE)

      error.value = apiError.message
      throw apiError
    } finally {
      isLeaving.value = false
    }
  }

  const restartRoom = async (currentSessionId?: string) => {
    error.value = null

    if (currentSessionId && !hasLeftSession.value) {
      try {
        await leaveRoom(currentSessionId)
      } catch {
        // Restart should still create a fresh room if leaving the old one fails.
      }
    }

    return createRoom()
  }

  const updateSessionStatus = (status: SessionStatus) => {
    if (!session.value || session.value.status === status) {
      return
    }

    session.value = {
      ...session.value,
      status,
    }
  }

  return {
    createRoom,
    error,
    hasLeftSession,
    isCreating,
    isJoining,
    isLeaving,
    isLoadingCurrent,
    isSessionClosed,
    isServiceReady,
    joinRoom,
    leaveRoom,
    loadCurrentRoom,
    refreshCurrentRoom,
    restartRoom,
    session,
    updateSessionStatus,
  }
}
