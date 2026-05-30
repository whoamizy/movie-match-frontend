# AGENTS.md

## Project

`movie-match-frontend` is a client-side Nuxt 4 app (`ssr: false`) for shared
movie picking. Current flow: create or join a room, authenticate participants
with backend cookies, choose filters, rate movie cards, receive realtime room
events, show a match, and handle closed/restart states.

Stack: Nuxt 4, Vue 3, TypeScript, UnoCSS, axios, and socket.io-client.

## Architecture

- App source lives under `app/`.
- API clients are created in `app/plugins/api.ts`; use injected `$api` or
  feature-specific APIs, not new axios clients.
- API services live in `app/services/api/*`; keep payload/response types next to
  the owning service.
- Normalize backend errors through `normalizeApiError` from
  `app/services/api/errors.ts` before showing user-facing state.
- Room flow state lives in `useRoomSession`, `useRoomStage`, and
  `useRoomRealtime`.
- UI primitives live in `app/components/ui`; reuse them before adding new base
  components.
- Theme tokens live in `app/assets/styles/theme.css`; UnoCSS config lives in
  `uno.config.ts`.
- Keep cookie auth intact: preserve `withCredentials: true` for API and
  realtime calls; do not store participant tokens in frontend state or storage.

## Commands

- `npm run dev` — start dev server.
- `npm run lint` — ESLint and Prettier checks.
- `npx vue-tsc --noEmit` — TypeScript/Vue type check.
- `npm run build` — production build.
- `npm run lintfix` — auto-fix lint/format issues; mutates files.

Before finishing, run `npm run lint`. Also run `npx vue-tsc --noEmit` for
TypeScript, composable, plugin, page state, prop/emit, routing, or API typing
changes. Also run `npm run build` for config, dependency, routing, plugin, or
build-logic changes.

## Code Style

- Keep `.vue` block order as `template`, `script`, `style`; always use
  `<script setup lang="ts">`.
- Components use `PascalCase`; composables use `useSomething`; pages/routes use
  `kebab-case`.
- Use `UPPER_SNAKE_CASE` only for true module constants; use `camelCase` for
  local variables, refs, computed values, and parameters.
- Type props and emits; avoid `any` unless there is a clear reason.
- Prefer `computed` for derived state and `watch` only for side effects.
- Keep room/session behavior in composables instead of scattering it across
  pages.
- Prefer UnoCSS utilities; use `scoped style` only when utilities or UnoCSS
  custom rules are not enough.
- Keep base styles for UI primitives inside their components when practical.
- Add SVG icons under `app/assets/icons` and expose them through `UiIcon`.
- Use the single Vue transition name `fade`; it must stay opacity-only.
- No `console.log` in production code; `console.error` is acceptable for errors.

## UI And Verification

- For visible UI build/restyle/polish work, use the `frontend-design` skill
  first.
- Do not run browser verification unless the user explicitly asks for it. If
  asked, use `browser-use`.
- There is no dedicated test runner yet. Add tests for composables/business logic
  and MVP flows when a runner is introduced.
- Do not commit secrets, API keys, tokens, private links, or session identifiers.
