<template>
  <section
    class="p-4 border border-primary/35 rounded-md bg-primary/10 flex flex-col gap-4"
    role="status"
    aria-live="polite"
  >
    <p class="text-sm text-primary">
      Сессия завершена. Можно создать новую комнату и начать подбор заново.
    </p>
    <UiButton
      type="button"
      class="w-full sm:w-fit"
      @click="$emit('createNewRoom')"
    >
      Создать новую комнату
    </UiButton>
  </section>
</template>

<script setup lang="ts">
defineEmits<{
  createNewRoom: []
}>()
</script>
