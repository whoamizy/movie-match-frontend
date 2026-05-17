<template>
  <main class="body page">
    <section class="container py-12 flex min-h-screen items-center">
      <div class="surface flex flex-col gap-8 w-full items-center">
        <div class="text-center flex flex-col gap-3 items-center">
          <UiBadge variant="accent"> вечерний выбор </UiBadge>
          <h1 class="text-5xl heading text-center md:text-8xl sm:text-7xl">
            Movie Match
          </h1>
          <p class="text-sm text-muted-foreground max-w-xl sm:text-base">
            Соберите комнату, отправьте приглашение и выбирайте фильм в одном
            ритме.
          </p>
        </div>

        <UiButton v-if="!isStartVisible" @click="showStart"> Начать </UiButton>

        <Transition name="room-action">
          <div
            v-if="isStartVisible"
            class="p-4 border border-border rounded-md bg-secondary/55 max-w-md w-full shadow-2xl"
          >
            <div
              class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex flex-col gap-1">
                <p class="text-sm text-foreground font-medium">
                  Комната почти готова
                </p>
                <p class="text-xs text-muted-foreground">
                  Создадим ссылку для второго участника.
                </p>
              </div>

              <UiButton
                :disabled="isCreating"
                :aria-busy="isCreating"
                class="shrink-0"
                @click="handleCreateRoom"
              >
                {{ isCreating ? 'Создаём...' : 'Создать комнату' }}
              </UiButton>
            </div>

            <p
              v-if="error"
              class="text-sm text-primary mt-4 px-3 py-2 border border-primary/35 rounded-md bg-primary/10"
              role="alert"
            >
              {{ error }}
            </p>
          </div>
        </Transition>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
const isStartVisible = ref(false)
const { createRoom, error, isCreating } = useRoomSession()

const showStart = () => {
  isStartVisible.value = true
}

const handleCreateRoom = async () => {
  try {
    const createdSession = await createRoom()

    if (createdSession) {
      await navigateTo(`/room/${createdSession.sessionId}`)
    }
  } catch {
    // The composable exposes a user-facing error message.
  }
}
</script>

<style scoped>
.room-action-enter-active,
.room-action-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.room-action-enter-from,
.room-action-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
