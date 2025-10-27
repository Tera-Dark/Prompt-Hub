<template>
  <div class="prompt-filter">
    <div class="filter-controls">
      <div class="filter-group">
        <label for="category-filter">Category:</label>
        <select 
          id="category-filter" 
          v-model="selectedCategory"
          @change="applyFilters"
        >
          <option :value="null">All Categories</option>
          <option 
            v-for="category in availableCategories" 
            :key="category" 
            :value="category"
          >
            {{ category }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="tag-filter">Tag:</label>
        <select 
          id="tag-filter" 
          v-model="selectedTag"
          @change="applyFilters"
        >
          <option :value="null">All Tags</option>
          <option 
            v-for="tag in availableTags" 
            :key="tag" 
            :value="tag"
          >
            {{ tag }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="search-input">Search:</label>
        <input 
          id="search-input"
          v-model="searchQuery"
          type="text"
          placeholder="Search prompts..."
          @input="applyFilters"
        />
      </div>

      <button 
        v-if="hasActiveFilters"
        class="clear-filters"
        @click="clearFilters"
      >
        Clear Filters
      </button>
    </div>

    <div class="filter-results">
      <p class="result-count">
        Showing {{ filteredPrompts.length }} of {{ totalPrompts }} prompts
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Prompt } from '@/types/prompt';

interface Props {
  prompts: Prompt[];
  categories: string[];
  tags: string[];
}

interface Emits {
  (e: 'filter', prompts: Prompt[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedCategory = ref<string | null>(null);
const selectedTag = ref<string | null>(null);
const searchQuery = ref('');

const availableCategories = computed(() => props.categories);
const availableTags = computed(() => props.tags);
const totalPrompts = computed(() => props.prompts.length);

const hasActiveFilters = computed(() => 
  selectedCategory.value !== null || 
  selectedTag.value !== null || 
  searchQuery.value.trim() !== ''
);

const filteredPrompts = computed(() => {
  let result = [...props.prompts];

  if (selectedCategory.value) {
    result = result.filter(p => p.category === selectedCategory.value);
  }

  if (selectedTag.value) {
    result = result.filter(p => p.tags.includes(selectedTag.value as string));
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

function applyFilters() {
  emit('filter', filteredPrompts.value);
}

function clearFilters() {
  selectedCategory.value = null;
  selectedTag.value = null;
  searchQuery.value = '';
  applyFilters();
}

watch(filteredPrompts, (newPrompts) => {
  emit('filter', newPrompts);
}, { immediate: true });
</script>

<style scoped>
.prompt-filter {
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.filter-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 200px;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
}

.filter-group select,
.filter-group input {
  padding: 0.5rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 4px;
  font-size: 0.875rem;
  background-color: var(--color-white);
  color: var(--color-gray-900);
}

.filter-group select:focus,
.filter-group input:focus {
  outline: none;
  border-color: var(--color-blue-600);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.clear-filters {
  padding: 0.5rem 1rem;
  background-color: var(--color-gray-200);
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-300);
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-filters:hover {
  background-color: var(--color-gray-300);
}

.filter-results {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-gray-200);
}

.result-count {
  font-size: 0.875rem;
  color: var(--color-gray-600);
  margin: 0;
}
</style>
