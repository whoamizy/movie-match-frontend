import { defineConfig, presetWind4, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [presetWind4()],
  theme: {
    colors: {
      accent: 'var(--color-accent)',
      'accent-foreground': 'var(--color-accent-foreground)',
      background: 'var(--color-background)',
      body: 'var(--color-body)',
      border: 'var(--color-border)',
      button: 'var(--color-button)',
      'button-foreground': 'var(--color-button-foreground)',
      card: 'var(--color-card)',
      'card-foreground': 'var(--color-card-foreground)',
      foreground: 'var(--color-foreground)',
      heading: 'var(--color-heading)',
      muted: 'var(--color-muted)',
      'muted-foreground': 'var(--color-muted-foreground)',
      primary: 'var(--color-primary)',
      'primary-foreground': 'var(--color-primary-foreground)',
      ring: 'var(--color-ring)',
      secondary: 'var(--color-secondary)',
      'secondary-foreground': 'var(--color-secondary-foreground)',
    },
  },
  shortcuts: {
    body: 'text-body font-sans leading-relaxed',
    button:
      'inline-flex items-center justify-center rounded-md bg-button px-4 py-2 text-sm text-button-foreground font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    container: 'mx-auto w-full max-w-3xl px-6 sm:px-8',
    heading:
      'text-heading font-sans font-semibold leading-none tracking-normal',
    page: 'min-h-screen overflow-hidden bg-background text-foreground antialiased',
    surface:
      'rounded-md border border-border bg-card px-6 py-8 sm:px-8 sm:py-10',
  },
  transformers: [transformerDirectives()],
})
