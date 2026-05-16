<template>
  <button :type="type" class="button" :disabled="disabled">
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    disabled: false,
    type: 'button',
  },
)
</script>
