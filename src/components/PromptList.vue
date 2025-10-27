<template>
  <div class="prompt-list">
    <div v-if="loading" class="loading">
      Loading prompts...
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="retry">Retry</button>
    </div>

    <div v-else-if="prompts.length === 0" class="empty">
      <p>No prompts available.</p>
    </div>

    <div v-else class="prompts">
      <div class="stats">
        <p>Total: {{ prompts.length }} prompts</p>
        <p>Categories: {{ categories.length }}</p>
        <p>Tags: {{ tags.length }}</p>
        <p v-if="dataVersion">Version: {{ dataVersion }}</p>
      </div>

      <div class="prompt-items">
        <div 
          v-for="prompt in prompts" 
          :key="prompt.id" 
          class="prompt-item"
        >
          <div class="prompt-header">
            <h3>{{ prompt.title }}</h3>
            <span class="category-badge">{{ prompt.category }}</span>
          </div>
          <p class="description">{{ prompt.description }}</p>
          <div class="tags">
            <span 
              v-for="tag in prompt.tags" 
              :key="tag" 
              class="tag"
            >
              {{ tag }}
            </span>
          </div>
          <div class="meta">
            <small>ID: {{ prompt.id }}</small>
            <small v-if="prompt.sourceLink">
              <a :href="prompt.sourceLink" target="_blank" rel="noopener noreferrer">
                Source
              </a>
            </small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { usePrompts } from '@/composables/usePrompts';

const { 
  prompts, 
  loading, 
  error, 
  dataVersion,
  categories,
  tags,
  fetchPrompts 
} = usePrompts();

onMounted(() => {
  fetchPrompts();
});

function retry() {
  fetchPrompts();
}
</script>

<style scoped>
.prompt-list {
  padding: 1rem;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 2rem;
  background-color: var(--color-white);
  border-radius: 8px;
  border: 1px solid var(--color-gray-300);
}

.error {
  color: var(--color-red-600);
}

.error button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: var(--color-blue-600);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error button:hover {
  background-color: var(--color-blue-700);
}

.stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--color-white);
  border-radius: 8px;
  border: 1px solid var(--color-gray-300);
}

.stats p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-gray-700);
}

.prompt-items {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.prompt-item {
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  padding: 1.5rem;
  transition: box-shadow 0.2s;
}

.prompt-item:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.prompt-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-gray-900);
  flex: 1;
}

.category-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: var(--color-blue-100);
  color: var(--color-blue-800);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.description {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: var(--color-gray-600);
  line-height: 1.5;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: var(--color-gray-100);
  color: var(--color-gray-700);
  border-radius: 4px;
  font-size: 0.75rem;
}

.meta {
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid var(--color-gray-200);
}

.meta small {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.meta a {
  color: var(--color-blue-600);
  text-decoration: none;
}

.meta a:hover {
  text-decoration: underline;
}
</style>
