const apiBase =
  process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1'
const realtimeBase =
  process.env.NUXT_PUBLIC_REALTIME_BASE ??
  apiBase.replace(/\/api\/v\d+\/?$/, '')

export default defineNuxtConfig({
  compatibilityDate: '2026-05-14',
  devtools: { enabled: true },
  ssr: false,
  experimental: {
    viteEnvironmentApi: true,
  },
  runtimeConfig: {
    public: {
      apiBase,
      realtimeBase,
    },
  },
  modules: ['@nuxt/eslint', '@unocss/nuxt'],
  css: ['@unocss/reset/tailwind.css', '~/assets/styles/theme.css'],
})
