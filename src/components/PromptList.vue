<template>
  <div class="prompt-list">
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading prompts...</p>
    </div>

    <div v-else-if="error" class="error">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>{{ error }}</p>
      <button @click="retry" class="retry-button">Retry</button>
    </div>

    <div v-else-if="displayedPrompts.length === 0" class="empty">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <h3>No prompts found</h3>
      <p>Try adjusting your search or filters to find what you're looking for.</p>
    </div>

    <div v-else class="prompt-grid">
      <PromptCard 
        v-for="prompt in displayedPrompts" 
        :key="prompt.id" 
        :prompt="prompt"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Prompt } from '@/types/prompt';
import PromptCard from './PromptCard.vue';

interface Props {
  prompts: Prompt[];
  loading?: boolean;
  error?: string | null;
}

interface Emits {
  (e: 'retry'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null
});

const emit = defineEmits<Emits>();

const displayedPrompts = computed(() => props.prompts);

function retry() {
  emit('retry');
}
</script>

<style scoped>
.prompt-list {
  width: 100%;
}

.loading,
.error,
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  background-color: var(--color-white);
  border-radius: 8px;
  border: 2px dashed var(--color-gray-300);
  min-height: 400px;
}

.loading {
  gap: 1.5rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-gray-200);
  border-top-color: var(--color-gray-900);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading p {
  margin: 0;
  font-size: 1rem;
  color: var(--color-gray-600);
  font-weight: 500;
}

.error {
  gap: 1.5rem;
  color: var(--color-gray-700);
}

.error svg {
  color: var(--color-gray-400);
}

.error p {
  margin: 0;
  font-size: 1rem;
  color: var(--color-gray-600);
}

.retry-button {
  margin-top: 0.5rem;
  padding: 0.625rem 1.5rem;
  background-color: var(--color-gray-900);
  color: var(--color-white);
  border: none;
  border-radius: 6px;
  font-size: 0.938rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background-color: var(--color-gray-800);
  transform: translateY(-1px);
}

.retry-button:active {
  transform: translateY(0);
}

.empty {
  gap: 1rem;
  color: var(--color-gray-600);
}

.empty svg {
  color: var(--color-gray-300);
}

.empty h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-gray-900);
}

.empty p {
  margin: 0;
  font-size: 1rem;
  color: var(--color-gray-600);
  max-width: 400px;
}

.prompt-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

@media (max-width: 768px) {
  .prompt-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .loading,
  .error,
  .empty {
    padding: 3rem 1.5rem;
    min-height: 300px;
  }
}

@media (min-width: 1400px) {
  .prompt-grid {
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  }
}
</style>
