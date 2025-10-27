<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">Prompt Hub</h1>
        <p class="app-subtitle">Your central hub for AI prompts</p>
      </div>
    </header>

    <main class="app-main">
      <div class="content-wrapper">
        <PromptList />
      </div>
    </main>

    <footer class="app-footer">
      <p>&copy; 2024 Prompt Hub</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import PromptList from '@/components/PromptList.vue';
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: var(--color-gray-900);
  color: var(--color-white);
  padding: 2rem 1rem;
  border-bottom: 2px solid var(--color-gray-800);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.app-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.app-subtitle {
  font-size: 1rem;
  color: var(--color-gray-300);
}

.app-main {
  flex: 1;
  padding: 2rem 1rem;
  background-color: var(--color-gray-100);
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.placeholder-text {
  text-align: center;
  font-size: 1.25rem;
  color: var(--color-gray-600);
  padding: 4rem 1rem;
  background-color: var(--color-white);
  border-radius: 8px;
  border: 2px dashed var(--color-gray-300);
}

.app-footer {
  background-color: var(--color-gray-900);
  color: var(--color-gray-400);
  padding: 1.5rem 1rem;
  text-align: center;
  border-top: 2px solid var(--color-gray-800);
}

.app-footer p {
  font-size: 0.875rem;
}
</style>
