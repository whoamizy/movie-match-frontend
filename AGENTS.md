# AGENTS.md

## Project overview

`movie-match-frontend` is the frontend for Movie Match: a shared movie-picking app based on rooms, invite links, filters, movie cards, like/dislike actions, and match events.

Stack: Nuxt 4, TypeScript, UnoCSS, and axios.

The app currently runs as a client-side Nuxt app (`ssr: false`). Implemented flow: create a room, receive and store the participant token, persist the invite link as a local convenience, navigate to the room waiting page, and copy the invite link.

Planned MVP flow: join by invite, choose filters, rate movie cards with like/dislike actions, show match events, and display the final list.

## Architecture notes

- App source lives under `app/`.
- API clients are created in `app/plugins/api.ts`; pages and components should use the injected `$api` or feature-specific APIs instead of creating their own axios clients.
- API service modules live in `app/services/api/*`; keep request payload and response types next to the service that owns them.
- Backend errors should be normalized through `normalizeApiError` from `app/services/api/errors.ts` before reaching user-facing state.
- Room/session state currently lives in `app/composables/useRoomSession.ts`.
- Participant token handling belongs to the shared API plugin interceptor. Preserve that path when adding authenticated API calls.
- `localStorage` invite-link persistence is a convenience for recovering the waiting page; do not make critical room/session behavior depend on it.

## Build and test commands

- `npm run dev` — start the dev server;
- `npm run build` — create a production build;
- `npm run generate` — generate a static build;
- `npm run preview` — preview the production build;
- `npm run lint` — run ESLint and Prettier checks;
- `npx vue-tsc --noEmit` — check TypeScript and Vue SFC type errors;
- `npm run lintfix` — auto-fix ESLint issues and format code. This mutates files, so use it only when fixing/formatting is intended.

Before finishing a task, run `npm run lint`. For TypeScript, composable, plugin, page state, prop/emit, routing, or API typing changes, also run `npx vue-tsc --noEmit`. For changes in config, dependencies, routing, plugins, or build logic, also run `npm run build`.

## Code style guidelines

- Keep `.vue` block order as `template`, `script`, `style` when present.
- Always use `<script setup lang="ts">`.
- Name components in `PascalCase`, composables as `useSomething`, and pages/routes in `kebab-case`.
- Use `UPPER_SNAKE_CASE` only for immutable module-level constants, env-like values, and other true constants; keep normal local variables, refs, computed values, and function parameters in `camelCase`.
- Type props and emits with TypeScript; use `any` only with a clear reason.
- Move business logic out of templates/page components into composables or stores when it is reused or grows.
- Use `computed` for derived data and `watch` only for side effects.
- Do not mutate props directly; use emits or `defineModel`.
- Keep room/session flow state in the existing composable pattern. As filters, swipes, and matches are added, keep related state in a single store/composable rather than scattering it across pages.
- Prefer UnoCSS utility classes; use `scoped style` only when utilities are not enough.
- Reuse existing UI primitives such as `UiButton` and `UiIcon` before adding new base components.
- Add new SVG icons under `app/assets/icons` and expose them through the existing `UiIcon` pattern.
- Do not leave `console.log` in production code; `console.error` is acceptable for errors.

## Layout workflow

- When a task involves building, restyling, or polishing a page or component, use the `frontend-design` skill first.
- Treat that skill as the default guide for visual direction, composition, typography, motion, spacing, and overall polish.
- Reuse existing project conventions, UnoCSS shortcuts, and CSS variables from `app/assets/styles/theme.css` where possible, but do not fall back to generic or bland UI patterns.
- If the user asks for a specific visual style or product feel, keep that intent consistent across the implementation.

## Browser verification workflow

- When a task changes visible UI, verify the result in the browser with the `browser-use` skill.
- Use the browser to check layout, spacing, responsiveness, interaction states, and obvious visual regressions on at least one desktop and one mobile-sized viewport when practical.
- Prefer a real browser check over guessing from code alone whenever alignment, overflow, or responsive behavior could be affected.
- If the browser reveals a visual issue, fix the implementation and re-check before finishing.

## Testing instructions

- There is no dedicated test command yet; the baseline quality check is `npm run lint`.
- After adding a test runner, document the command in `package.json` and in this file.
- Add unit tests for composables, stores, and business logic.
- Add e2e/integration tests for MVP flows: room, invite, filters, like/dislike, match, final list.
- Check loading/error/empty states and verify UI on at least mobile and desktop.
- Test data must not include real API keys, tokens, or private links.

## Security considerations

- Do not store secrets in client code, the repository, `localStorage`, public runtime config, or env files that may be committed.
- Do not call APIs directly from the frontend when a private key is required; route those requests through the backend.
- Treat data from URLs, invite links, query params, and realtime events as untrusted and validate it.
- Do not use `v-html` for user data without sanitization and a clear reason.
- Do not log tokens, private links, session identifiers, or other sensitive data.
- Handle realtime events with invalid payloads, duplicates, and state desync in mind.
- API errors must not expose stack traces, keys, or internal backend details.
- Add new dependencies only when clearly necessary.
