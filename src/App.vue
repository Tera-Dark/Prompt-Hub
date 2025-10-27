<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">Prompt Hub</h1>
        <p class="app-subtitle">Discover and copy AI prompts for any task</p>
      </div>
    </header>

    <main class="app-main">
      <div class="content-wrapper">
        <div class="controls-section">
          <SearchBar v-model="searchQuery" />
          <CategoryFilter 
            :categories="categories"
            :result-count="filteredPrompts.length"
            :show-count="true"
            @update:selected-category="handleCategoryChange"
          />
        </div>

        <PromptList 
          :prompts="filteredPrompts"
          :loading="loading"
          :error="error"
          @retry="fetchPrompts"
        />
      </div>
    </main>

    <footer class="app-footer">
      <p>&copy; 2024 Prompt Hub. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePrompts } from '@/composables/usePrompts';
import PromptList from '@/components/PromptList.vue';
import SearchBar from '@/components/SearchBar.vue';
import CategoryFilter from '@/components/CategoryFilter.vue';

const { 
  prompts, 
  loading, 
  error, 
  categories,
  fetchPrompts 
} = usePrompts();

const searchQuery = ref('');
const selectedCategory = ref<string | null>(null);

const filteredPrompts = computed(() => {
  let result = prompts.value;

  if (selectedCategory.value) {
    result = result.filter(p => p.category === selectedCategory.value);
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(p => 
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.prompt.toLowerCase().includes(query) ||
      p.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  return result;
});

function handleCategoryChange(category: string | null) {
  selectedCategory.value = category;
}

onMounted(() => {
  fetchPrompts();
});
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
  padding: 2.5rem 1.5rem;
  border-bottom: 1px solid var(--color-gray-800);
}

.header-content {
  max-width: 1280px;
  margin: 0 auto;
}

.app-title {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  letter-spacing: -0.025em;
}

.app-subtitle {
  font-size: 1.125rem;
  color: var(--color-gray-400);
  font-weight: 400;
}

.app-main {
  flex: 1;
  padding: 2.5rem 1.5rem;
  background-color: var(--color-gray-100);
}

.content-wrapper {
  max-width: 1280px;
  margin: 0 auto;
}

.controls-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  background-color: var(--color-white);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--color-gray-300);
}

.app-footer {
  background-color: var(--color-gray-900);
  color: var(--color-gray-500);
  padding: 2rem 1.5rem;
  text-align: center;
  border-top: 1px solid var(--color-gray-800);
}

.app-footer p {
  font-size: 0.875rem;
  margin: 0;
}

@media (max-width: 768px) {
  .app-header {
    padding: 2rem 1rem;
  }

  .app-title {
    font-size: 1.75rem;
  }

  .app-subtitle {
    font-size: 1rem;
  }

  .app-main {
    padding: 1.5rem 1rem;
  }

  .controls-section {
    padding: 1rem;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .app-footer {
    padding: 1.5rem 1rem;
  }
}

@media (min-width: 1400px) {
  .content-wrapper {
    max-width: 1400px;
  }
}
</style>
