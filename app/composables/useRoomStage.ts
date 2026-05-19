import type {
  RoomStage,
  SelectionStateResponse,
} from '~/services/api/selection'
import type { SessionResponse } from '~/services/api/sessions'

const READY_SESSION_STATUS = 'READY'
const CLOSED_SESSION_STATUS = 'CLOSED'

export const useRoomStage = (
  activeSession: MaybeRefOrGetter<SessionResponse | null>,
) => {
  const { $selectionApi } = useNuxtApp()
  const selectionState = ref<SelectionStateResponse | null>(null)
  const isLoadingSelectionState = ref(false)
  const localPreferencesReady = ref(false)

  const normalizedSession = computed(() => toValue(activeSession))
  const selectionSyncKey = computed(() => {
    const session = normalizedSession.value

    return session ? `${session.sessionId}:${session.status}` : ''
  })

  const fallbackStage = computed<RoomStage | null>(() => {
    const session = normalizedSession.value

    if (!session) {
      return null
    }

    if (session.status === CLOSED_SESSION_STATUS) {
      return 'FINISHED'
    }

    if (session.status !== READY_SESSION_STATUS) {
      return 'WAITING'
    }

    if (localPreferencesReady.value || selectionState.value?.preferences) {
      return 'CHOOSING'
    }

    return 'FILTERS'
  })

  const roomStage = computed<RoomStage | null>(() => {
    const session = normalizedSession.value

    if (!session) {
      return null
    }

    if (session.status === CLOSED_SESSION_STATUS) {
      return 'FINISHED'
    }

    if (session.status !== READY_SESSION_STATUS) {
      return 'WAITING'
    }

    return selectionState.value?.stage ?? fallbackStage.value
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

  const markPreferencesReady = () => {
    localPreferencesReady.value = true

    if (selectionState.value && selectionState.value.stage === 'FILTERS') {
      selectionState.value = {
        ...selectionState.value,
        stage: 'CHOOSING',
      }
    }
  }

  const resetRoomStage = () => {
    selectionState.value = null
    localPreferencesReady.value = false
  }

  watch(
    selectionSyncKey,
    (nextKey, previousKey) => {
      if (!nextKey) {
        resetRoomStage()
        return
      }

      if (nextKey.split(':')[0] !== previousKey?.split(':')[0]) {
        localPreferencesReady.value = false
      }

      void loadSelectionState()
    },
    { immediate: true },
  )

  return {
    isLoadingSelectionState,
    loadSelectionState,
    markPreferencesReady,
    resetRoomStage,
    roomStage,
    selectionState,
  }
}
