<template>
  <span
    v-if="iconUrl"
    class="ui-icon bg-current shrink-0 inline-block"
    :aria-hidden="title ? undefined : true"
    :aria-label="title"
    :role="title ? 'img' : undefined"
    :style="iconStyle"
  />
</template>

<script setup lang="ts">
type IconName = 'check' | 'close-session' | 'copy' | 'dislike' | 'like' | 'sad'

const ICON_MODULES = import.meta.glob<string>('../../assets/icons/*.svg', {
  eager: true,
  import: 'default',
  query: '?url',
})

const ICONS = Object.fromEntries(
  Object.entries(ICON_MODULES).map(([path, url]) => [
    path.split('/').pop()?.replace('.svg', ''),
    url,
  ]),
) as Record<IconName, string>

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number | string
    title?: string
  }>(),
  {
    size: 20,
    title: undefined,
  },
)

const iconUrl = computed(() => ICONS[props.name])
const normalizedSize = computed(() => {
  const size = String(props.size)

  return /^\d+(\.\d+)?$/.test(size) ? `${size}px` : size
})
const iconStyle = computed(() => ({
  '--icon-url': iconUrl.value ? `url("${iconUrl.value}")` : undefined,
  height: normalizedSize.value,
  width: normalizedSize.value,
}))
</script>

<style scoped>
.ui-icon {
  mask: var(--icon-url) center / contain no-repeat;
  -webkit-mask: var(--icon-url) center / contain no-repeat;
}
</style>
