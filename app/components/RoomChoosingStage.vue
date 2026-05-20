<template>
  <section
    class="p-5 border border-accent/45 rounded-md bg-accent/10 flex flex-col gap-3"
    role="status"
    aria-live="polite"
  >
    <UiBadge variant="success" size="sm"> выбор фильма </UiBadge>
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl heading">Можно переходить к карточкам</h2>
      <p class="text-sm text-foreground">
        Backend уже готов отдавать следующий фильм и принимать лайки/дизлайки.
        На фронте этот экран подключим следующим шагом.
      </p>
    </div>
  </section>
</template>
