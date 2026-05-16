<template>
  <main class="body page">
    <section class="container py-12 flex min-h-screen items-center">
      <div class="surface flex flex-col gap-8 w-full items-center">
        <h1 class="text-5xl heading text-center md:text-8xl sm:text-7xl">
          Movie Match
        </h1>

        <UiButton @click="alertMessage">Начать</UiButton>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
const alertMessage = () => {
  alert('Redirect')
}
</script>
