<template>
  <div
    class="text-muted-foreground text-center flex flex-col gap-3.5 min-h-32 items-center justify-center"
    role="status"
    aria-live="polite"
  >
    <span
      class="ui-loader-spinner border-2 border-border/70 border-t-accent rounded-full h-10 w-10"
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

<style scoped>
.ui-loader-spinner {
  display: inline-block;
  transform-origin: center center;
  will-change: transform;
  animation: ui-loader-spin 800ms linear infinite;
}

@keyframes ui-loader-spin {
  from {
    transform: translateZ(0) rotate(0deg);
  }

  to {
    transform: translateZ(0) rotate(360deg);
  }
}
</style>
