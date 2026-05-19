<template>
  <button
    type="button"
    :class="chipClass"
    :aria-pressed="selected"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    disabled?: boolean
    selected?: boolean
    value?: string
  }>(),
  {
    disabled: false,
    selected: false,
    value: undefined,
  },
)

const chipClass = computed(() => [
  'inline-flex min-h-10 max-w-56 shrink-0 items-center justify-center rounded-full border px-3 py-2 text-center text-sm font-medium leading-none whitespace-normal break-words transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45 sm:px-4',
  props.selected
    ? 'border-primary bg-primary text-primary-foreground'
    : 'border-border bg-secondary/70 text-foreground hover:border-accent/70 hover:bg-accent/10 hover:text-accent',
])
</script>
