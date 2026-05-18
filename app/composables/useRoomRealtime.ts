import { io, type Socket } from 'socket.io-client'

interface SessionUpdatedPayload {
  status: string
  participantsCount: number
}

interface SessionStatePayload extends SessionUpdatedPayload {
  participantsCount: number
}

interface ParticipantChangedPayload {
  participantId: string
  status: string
  participantsCount: number
}

const READY_SESSION_STATUS = 'READY'
const CLOSED_SESSION_STATUS = 'CLOSED'

export const useRoomRealtime = (sessionId: MaybeRefOrGetter<string>) => {
  const config = useRuntimeConfig()
  const {
    refreshCurrentRoom,
    session,
    updateParticipantsCount,
    updateSessionStatus,
  } = useRoomSession()
  const isConnected = ref(false)
  const error = ref<string | null>(null)
  let socket: Socket | null = null
  let revalidationTimer: ReturnType<typeof setTimeout> | null = null

  const normalizedSessionId = computed(() => toValue(sessionId))
  const isActiveSession = computed(
    () => session.value?.sessionId === normalizedSessionId.value,
  )
  const socketUrl = computed(
    () => `${String(config.public.realtimeBase).replace(/\/$/, '')}/sessions`,
  )

  const disconnect = () => {
    if (!socket) {
      return
    }

    socket.disconnect()
    socket = null
    isConnected.value = false
  }

  const markSessionClosed = () => {
    error.value = null
    updateSessionStatus(CLOSED_SESSION_STATUS)
    updateParticipantsCount(0)
    disconnect()
  }

  const revalidateCurrentRoom = () => {
    if (!import.meta.client || revalidationTimer || !isActiveSession.value) {
      return
    }

    revalidationTimer = setTimeout(() => {
      revalidationTimer = null

      void refreshCurrentRoom().catch(() => {
        // Realtime should not surface current-room fallback failures as UI noise.
      })
    }, 300)
  }

  const connect = () => {
    if (!import.meta.client || socket || !isActiveSession.value) {
      return
    }

    socket = io(socketUrl.value, {
      transports: ['websocket'],
      withCredentials: true,
    })

    socket.on('connect', () => {
      error.value = null
      isConnected.value = true
    })

    socket.on('disconnect', () => {
      isConnected.value = false
      revalidateCurrentRoom()
    })

    socket.on('connect_error', () => {
      error.value = 'Не удалось подключиться к событиям комнаты.'
      isConnected.value = false
      revalidateCurrentRoom()
    })

    socket.on('session:state', (payload: SessionStatePayload) => {
      updateParticipantsCount(payload.participantsCount)

      if (payload.status === CLOSED_SESSION_STATUS) {
        markSessionClosed()
        return
      }

      updateSessionStatus(payload.status)
    })

    socket.on('session:updated', (payload: SessionUpdatedPayload) => {
      updateParticipantsCount(payload.participantsCount)

      if (payload.status === CLOSED_SESSION_STATUS) {
        markSessionClosed()
        return
      }

      updateSessionStatus(payload.status)
    })

    socket.on('session:ready', (payload?: SessionUpdatedPayload) => {
      updateSessionStatus(payload?.status ?? READY_SESSION_STATUS)
      updateParticipantsCount(payload?.participantsCount ?? 2)
    })

    socket.on('session:joined', () => {
      error.value = null
    })

    socket.on('participant:joined', (payload: ParticipantChangedPayload) => {
      error.value = null
      updateSessionStatus(payload.status)
      updateParticipantsCount(payload.participantsCount)
    })

    socket.on('participant:left', (payload: ParticipantChangedPayload) => {
      updateSessionStatus(payload.status)
      updateParticipantsCount(payload.participantsCount)
      revalidateCurrentRoom()
    })

    socket.on('session:closed', markSessionClosed)
  }

  watch(
    [normalizedSessionId, isActiveSession],
    ([nextSessionId, nextIsActiveSession]) => {
      disconnect()

      if (!nextSessionId || !nextIsActiveSession) {
        return
      }

      connect()
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (revalidationTimer) {
      clearTimeout(revalidationTimer)
      revalidationTimer = null
    }

    disconnect()
  })

  return {
    error,
    isConnected,
  }
}
