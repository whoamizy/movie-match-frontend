const apiBase =
  process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1'
const realtimeBase =
  process.env.NUXT_PUBLIC_REALTIME_BASE ?? 'http://localhost:4000'

const getManualChunk = (id: string) => {
  if (!id.includes('node_modules')) {
    return
  }

  const packageName = id.match(
    /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/,
  )?.[1]

  if (!packageName) {
    return
  }

  if (packageName === 'vue' || packageName === 'vue-router') {
    return 'vue-vendor'
  }

  if (packageName === 'axios') {
    return 'http-vendor'
  }

  if (packageName === 'socket.io-client') {
    return 'realtime-vendor'
  }
}

export default defineNuxtConfig({
  compatibilityDate: '2026-05-14',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Movie Match',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
    pageTransition: {
      mode: 'out-in',
      name: 'fade',
    },
  },
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
  vite: {
    build: {
      rollupOptions: {
        output: {
          chunkFileNames: '_nuxt/[name].[hash].js',
          manualChunks: getManualChunk,
        },
      },
    },
  },
})
