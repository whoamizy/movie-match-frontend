<template>
  <div
    class="text-muted-foreground text-center flex flex-col gap-3.5 min-h-32 items-center justify-center"
    role="status"
    aria-live="polite"
  >
    <span
      class="border-2 border-border/70 border-t-accent rounded-full h-10 w-10 animate-spin"
      aria-hidden="true"
    />
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
