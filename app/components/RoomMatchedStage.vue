<template>
  <section
    class="p-5 border border-accent/45 rounded-md bg-accent/10 flex flex-col gap-3"
    role="status"
    aria-live="polite"
  >
    <UiBadge variant="success" size="sm"> совпадение </UiBadge>
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl heading">Есть общий фильм</h2>
      <p class="text-sm text-foreground">
        Экран матча будет показывать найденный фильм и действия для продолжения
        подбора.
      </p>
    </div>
  </section>
</template>
