import type {
  RoomStage,
  SelectionStateResponse,
} from '~/services/api/selection'
import type { SessionResponse } from '~/services/api/sessions'

const WAITING_SESSION_STATUS = 'WAITING'
const COMPLETED_SESSION_STATUS = 'COMPLETED'
const CLOSED_SESSION_STATUS = 'CLOSED'

export const useRoomStage = (
  activeSession: MaybeRefOrGetter<SessionResponse | null>,
) => {
  const { $selectionApi } = useNuxtApp()
  const selectionState = ref<SelectionStateResponse | null>(null)
  const isLoadingSelectionState = ref(false)

  const normalizedSession = computed(() => toValue(activeSession))
  const selectionSyncKey = computed(() => {
    const session = normalizedSession.value

    return session ? `${session.sessionId}:${session.status}` : ''
  })

  const roomStage = computed<RoomStage | null>(() => {
    const session = normalizedSession.value

    if (!session) {
      return null
    }

    if (session.status === COMPLETED_SESSION_STATUS) {
      return (
        selectionState.value?.stage ??
        (isLoadingSelectionState.value ? null : 'MATCHED')
      )
    }

    if (session.status === CLOSED_SESSION_STATUS) {
      return (
        selectionState.value?.stage ??
        (isLoadingSelectionState.value ? null : 'CLOSED')
      )
    }

    if (session.status === WAITING_SESSION_STATUS) {
      return 'WAITING'
    }

    return selectionState.value?.stage ?? 'WAITING'
  })

  const loadSelectionState = async () => {
    const sessionId = normalizedSession.value?.sessionId

    if (!sessionId || isLoadingSelectionState.value) {
      return selectionState.value
    }

    isLoadingSelectionState.value = true

    try {
      selectionState.value = await $selectionApi.getSelectionState(sessionId)
    } catch {
      selectionState.value = null
    } finally {
      isLoadingSelectionState.value = false
    }

    return selectionState.value
  }

  const resetRoomStage = () => {
    selectionState.value = null
  }

  watch(
    selectionSyncKey,
    (nextKey) => {
      const nextSession = normalizedSession.value

      if (!nextKey || !nextSession) {
        resetRoomStage()
        return
      }

      selectionState.value = null

      if (nextSession.status !== WAITING_SESSION_STATUS) {
        void loadSelectionState()
      }
    },
    { flush: 'sync', immediate: true },
  )

  return {
    isLoadingSelectionState,
    loadSelectionState,
    resetRoomStage,
    roomStage,
    selectionState,
  }
}
