<template>
  <input
    :value="modelValue"
    :type="type"
    :class="inputClass"
    :disabled="disabled"
    :inputmode="inputmode"
    :max="max"
    :min="min"
    :placeholder="placeholder"
    :aria-invalid="invalid"
    @input="handleInput"
    @keydown="handleKeydown"
  />
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    disabled?: boolean
    inputmode?:
      | 'none'
      | 'text'
      | 'tel'
      | 'url'
      | 'email'
      | 'numeric'
      | 'decimal'
    invalid?: boolean
    max?: number | string
    min?: number | string
    modelValue?: number | string
    numeric?: boolean
    placeholder?: string
    type?: string
  }>(),
  {
    disabled: false,
    inputmode: undefined,
    invalid: false,
    max: undefined,
    min: undefined,
    modelValue: '',
    numeric: false,
    placeholder: undefined,
    type: 'text',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputClass = computed(() => [
  'w-full rounded-md border bg-muted px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm',
  props.invalid ? 'border-primary bg-primary/10' : 'border-border',
])

const sanitizeNumericValue = (value: string) => value.replace(/\D/g, '')

const handleInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const nextValue = props.numeric
    ? sanitizeNumericValue(input.value)
    : input.value

  if (input.value !== nextValue) {
    input.value = nextValue
  }

  emit('update:modelValue', nextValue)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!props.numeric) {
    return
  }

  if (event.metaKey || event.ctrlKey || event.altKey) {
    return
  }

  if (
    [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
      'Tab',
      'Enter',
    ].includes(event.key)
  ) {
    return
  }

  if (!/^\d$/.test(event.key)) {
    event.preventDefault()
  }
}
</script>
