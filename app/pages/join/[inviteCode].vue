<template>
  <main class="body page">
    <section class="container py-12 flex min-h-screen items-center">
      <div class="surface flex flex-col gap-8 w-full">
        <div class="flex flex-col gap-3">
          <p
            class="text-xs text-accent tracking-[0.18em] px-3 py-1 border border-border rounded-full w-fit uppercase"
          >
            приглашение
          </p>
          <div class="flex flex-col gap-3">
            <h1 class="text-4xl heading sm:text-5xl">
              {{ pageTitle }}
            </h1>
            <p class="text-sm text-muted-foreground max-w-xl sm:text-base">
              {{ pageDescription }}
            </p>
          </div>
        </div>

        <div
          v-if="isJoining"
          class="p-4 border border-border rounded-md bg-secondary/55 flex flex-col gap-3"
          aria-busy="true"
          aria-live="polite"
        >
          <span
            class="text-xs text-muted-foreground tracking-[0.16em] uppercase"
          >
            подключение
          </span>
          <div class="p-3 border border-border rounded-md bg-muted">
            <div class="rounded-md bg-border/70 h-5 w-full animate-pulse" />
          </div>
        </div>

        <div
          v-else-if="error"
          class="p-4 border border-primary/35 rounded-md bg-primary/10 flex flex-col gap-4"
          role="alert"
        >
          <p class="text-sm text-primary">
            {{ error }}
          </p>
          <UiButton type="button" class="w-full sm:w-fit" @click="retryJoin">
            Попробовать ещё раз
          </UiButton>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const { error, isJoining, joinRoom } = useRoomSession()

const inviteCode = computed(() => String(route.params.inviteCode ?? ''))
const pageTitle = computed(() =>
  error.value ? 'Не удалось войти в комнату' : 'Подключаем к комнате',
)
const pageDescription = computed(() =>
  error.value
    ? 'Ссылка может быть неверной, устаревшей или комната уже заполнена.'
    : 'Сохраняем участника и готовим общий экран для выбора фильма.',
)

const connectByInvite = async () => {
  if (!inviteCode.value) {
    return
  }

  try {
    const joinedSession = await joinRoom(inviteCode.value)

    if (joinedSession) {
      await navigateTo(`/room/${joinedSession.sessionId}`, { replace: true })
    }
  } catch {
    // The composable exposes a user-facing error message.
  }
}

const retryJoin = () => {
  void connectByInvite()
}

onMounted(() => {
  void connectByInvite()
})
</script>
