<template>
  <div
    class="text-muted-foreground text-center flex flex-col gap-3.5 min-h-32 items-center justify-center"
    role="status"
    aria-live="polite"
  >
    <UiIcon name="loader" size="40" class="text-accent animate-spin" />
    <span class="text-sm leading-6">
      <slot>{{ label }}</slot>
    </span>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
  }>(),
  {
    label: 'Загрузка...',
  },
)
</script>
