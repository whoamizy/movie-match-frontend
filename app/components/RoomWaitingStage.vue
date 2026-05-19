<template>
  <div
    class="p-4 border border-border rounded-md bg-secondary/55 flex flex-col gap-3"
  >
    <UiBadge variant="muted" size="sm"> Ссылка приглашения </UiBadge>
    <div
      class="p-3 border border-border rounded-md bg-muted flex flex-col gap-3 min-w-0 sm:flex-row sm:items-center sm:justify-between"
    >
      <span class="text-sm text-foreground min-w-0 truncate">
        {{ inviteLink }}
      </span>
      <UiButton
        type="button"
        class="shrink-0 gap-2 w-full sm:w-auto"
        :aria-label="copyButtonLabel"
        :title="copyButtonLabel"
        @click="copyInviteLink"
      >
        <UiIcon :name="copyButtonIcon" size="18" data-icon="inline-start" />
        <span>{{ copyButtonLabel }}</span>
      </UiButton>
    </div>
    <p
      v-if="copyMessage"
      class="text-xs text-primary px-3 py-2 border border-primary/35 rounded-md bg-primary/10"
      role="alert"
    >
      {{ copyMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  inviteLink: string
}>()

const copyState = ref<'idle' | 'copied' | 'error'>('idle')
let copyResetTimer: ReturnType<typeof setTimeout> | null = null

const copyButtonLabel = computed(() =>
  copyState.value === 'copied' ? 'Ссылка скопирована' : 'Скопировать ссылку',
)
const copyButtonIcon = computed(() =>
  copyState.value === 'copied' ? 'check' : 'copy',
)
const copyMessage = computed(() => {
  if (copyState.value === 'error') {
    return 'Не удалось скопировать ссылку. Выдели её вручную.'
  }

  return ''
})

const resetCopyStateLater = () => {
  if (copyResetTimer) {
    clearTimeout(copyResetTimer)
  }

  copyResetTimer = setTimeout(() => {
    copyState.value = 'idle'
    copyResetTimer = null
  }, 1800)
}

const copyTextToClipboard = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textArea = document.createElement('textarea')

  textArea.value = text
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.inset = '0 auto auto 0'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.select()

  const isCopied = document.execCommand('copy')

  document.body.removeChild(textArea)

  if (!isCopied) {
    throw new Error('Copy command failed')
  }
}

const copyInviteLink = async () => {
  if (!props.inviteLink) {
    return
  }

  try {
    await copyTextToClipboard(props.inviteLink)
    copyState.value = 'copied'
  } catch {
    copyState.value = 'error'
  } finally {
    resetCopyStateLater()
  }
}

onBeforeUnmount(() => {
  if (copyResetTimer) {
    clearTimeout(copyResetTimer)
  }
})
</script>
