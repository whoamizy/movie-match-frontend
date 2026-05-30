<template>
  <span :class="badgeClass">
    <slot />
  </span>
</template>

<script setup lang="ts">
const BADGE_VARIANTS = {
  accent: 'border-accent/45 bg-accent/10 text-accent',
  default: 'border-border bg-secondary/55 text-foreground',
  muted: 'border-border/90 bg-card/80 text-muted-foreground',
  primary: 'border-primary/40 bg-primary/10 text-primary',
  success: 'border-accent/45 bg-accent/10 text-accent',
  warning: 'border-primary/35 bg-primary/10 text-primary',
} as const

const BADGE_SIZES = {
  md: 'px-3 py-1 text-xs',
  sm: 'px-2.5 py-0.5 text-xs',
} as const

const props = withDefaults(
  defineProps<{
    size?: keyof typeof BADGE_SIZES
    uppercase?: boolean
    variant?: keyof typeof BADGE_VARIANTS
  }>(),
  {
    size: 'md',
    uppercase: true,
    variant: 'default',
  },
)

const badgeClass = computed(() => [
  'inline-block box-border max-w-full w-fit rounded-full border text-center font-medium leading-snug tracking-widest whitespace-normal break-anywhere transition-colors',
  BADGE_SIZES[props.size],
  BADGE_VARIANTS[props.variant],
  props.uppercase ? 'uppercase' : '',
])
</script>
