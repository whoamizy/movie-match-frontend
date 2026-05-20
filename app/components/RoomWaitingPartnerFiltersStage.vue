<template>
  <section
    class="p-5 border border-accent/45 rounded-md bg-accent/10 flex flex-col gap-3"
    role="status"
    aria-live="polite"
  >
    <UiBadge variant="accent" size="sm"> фильтры сохранены </UiBadge>
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl heading">Ждём фильтры второго участника</h2>
      <p class="text-sm text-foreground">
        Твои настройки уже сохранены. Как только второй участник выберет свои
        фильтры, комната перейдёт к общему выбору фильма.
      </p>
    </div>
  </section>
</template>
