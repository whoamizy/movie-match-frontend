export default defineNuxtConfig({
  compatibilityDate: '2026-05-14',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiBase:
        process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1',
    },
  },
  modules: ['@nuxt/eslint', '@unocss/nuxt'],
  css: ['@unocss/reset/tailwind.css', '~/assets/styles/theme.css'],
})
