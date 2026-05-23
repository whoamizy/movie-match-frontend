import type { MovieCardResponse } from '~/services/api/movies'
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
  let selectionRequestId = 0

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
    const activeRequestId = selectionRequestId + 1
    selectionRequestId = activeRequestId

    try {
      const nextSelectionState =
        await $selectionApi.getSelectionState(sessionId)

      if (activeRequestId === selectionRequestId) {
        selectionState.value = nextSelectionState
      }
    } catch {
      if (activeRequestId === selectionRequestId) {
        selectionState.value = null
      }
    } finally {
      if (activeRequestId === selectionRequestId) {
        isLoadingSelectionState.value = false
      }
    }

    return selectionState.value
  }

  const applyMatchedMovie = (matchedMovie: MovieCardResponse) => {
    selectionRequestId += 1
    isLoadingSelectionState.value = false
    selectionState.value = {
      matchedMovie,
      preferences: selectionState.value?.preferences ?? null,
      stage: 'MATCHED',
    }
  }

  const resetRoomStage = () => {
    selectionRequestId += 1
    isLoadingSelectionState.value = false
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

      if (
        nextSession.status === COMPLETED_SESSION_STATUS &&
        selectionState.value?.stage === 'MATCHED'
      ) {
        return
      }

      resetRoomStage()

      if (nextSession.status !== WAITING_SESSION_STATUS) {
        void loadSelectionState()
      }
    },
    { flush: 'sync', immediate: true },
  )

  return {
    applyMatchedMovie,
    isLoadingSelectionState,
    loadSelectionState,
    resetRoomStage,
    roomStage,
    selectionState,
  }
}
