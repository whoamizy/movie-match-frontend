import { io, type Socket } from 'socket.io-client'

interface SessionUpdatedPayload {
  status: string
}

interface SessionStatePayload extends SessionUpdatedPayload {
  participantsCount: number
}

const READY_SESSION_STATUS = 'READY'

export const useRoomRealtime = (sessionId: MaybeRefOrGetter<string>) => {
  const config = useRuntimeConfig()
  const {
    participantsCount,
    session,
    updateParticipantsCount,
    updateSessionStatus,
  } = useRoomSession()
  const isConnected = ref(false)
  const error = ref<string | null>(null)
  let socket: Socket | null = null

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
    })

    socket.on('connect_error', () => {
      error.value = 'Не удалось подключиться к событиям комнаты.'
      isConnected.value = false
    })

    socket.on('session:state', (payload: SessionStatePayload) => {
      updateSessionStatus(payload.status)
      updateParticipantsCount(payload.participantsCount)
    })

    socket.on('session:updated', (payload: SessionUpdatedPayload) => {
      updateSessionStatus(payload.status)
    })

    socket.on('session:ready', (payload?: SessionUpdatedPayload) => {
      updateSessionStatus(payload?.status ?? READY_SESSION_STATUS)
      updateParticipantsCount(2)
    })

    socket.on('session:joined', () => {
      error.value = null
    })

    socket.on('participant:joined', () => {
      error.value = null
      updateParticipantsCount(Math.max(participantsCount.value ?? 1, 2))
    })
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

  onBeforeUnmount(disconnect)

  return {
    error,
    isConnected,
  }
}
