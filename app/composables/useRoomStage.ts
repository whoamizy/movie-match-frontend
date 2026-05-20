import type {
  RoomStage,
  SelectionStateResponse,
} from '~/services/api/selection'
import type { SessionResponse } from '~/services/api/sessions'

const READY_SESSION_STATUS = 'READY'
const WAITING_SESSION_STATUS = 'WAITING'
const IN_PROGRESS_SESSION_STATUS = 'IN_PROGRESS'
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

  const isFinishedSession = (status: string) =>
    status === COMPLETED_SESSION_STATUS || status === CLOSED_SESSION_STATUS
  const isSelectionDrivenSession = (status: string) =>
    status === READY_SESSION_STATUS || status === IN_PROGRESS_SESSION_STATUS

  const roomStage = computed<RoomStage | null>(() => {
    const session = normalizedSession.value

    if (!session) {
      return null
    }

    if (isFinishedSession(session.status)) {
      return 'FINISHED'
    }

    if (
      session.status === WAITING_SESSION_STATUS ||
      !isSelectionDrivenSession(session.status)
    ) {
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
      if (!nextKey) {
        resetRoomStage()
        return
      }

      selectionState.value = null
      void loadSelectionState()
    },
    { immediate: true },
  )

  return {
    isLoadingSelectionState,
    loadSelectionState,
    resetRoomStage,
    roomStage,
    selectionState,
  }
}
