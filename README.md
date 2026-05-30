# movie-match-frontend

Frontend для Movie Match — приложения, где два участника создают комнату,
заходят по приглашению, выбирают фильтры и вместе оценивают фильмы лайками и
дизлайками, пока не появится общее совпадение.

Проект работает как client-side Nuxt-приложение и подключается к backend API и
realtime-событиям комнаты. Стек: Nuxt 4, Vue 3, TypeScript, UnoCSS, axios и
socket.io-client.

## Локальный запуск

Нужны Node.js, npm и запущенный backend Movie Match. По умолчанию frontend ждёт
backend на `http://localhost:4000`.

Установить зависимости:

```bash
npm install
```

При необходимости задать адреса backend в `.env`:

```bash
NUXT_PUBLIC_API_BASE=http://localhost:4000/api/v1
NUXT_PUBLIC_REALTIME_BASE=http://localhost:4000
```

Запустить dev server:

```bash
npm run dev
```

Nuxt dev server по умолчанию откроется на `http://localhost:3000`.
