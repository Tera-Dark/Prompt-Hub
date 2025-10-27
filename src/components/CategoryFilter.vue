<template>
  <div class="category-filter">
    <div class="filter-label">
      <span>Categories</span>
      <span class="result-count" v-if="showCount">{{ resultCount }} result{{ resultCount !== 1 ? 's' : '' }}</span>
    </div>
    <div class="category-pills">
      <button 
        class="category-pill"
        :class="{ active: selectedCategory === null }"
        @click="selectCategory(null)"
      >
        All
      </button>
      <button 
        v-for="category in categories"
        :key="category"
        class="category-pill"
        :class="{ active: selectedCategory === category }"
        @click="selectCategory(category)"
      >
        <span class="category-icon" v-if="getCategoryIcon(category)">{{ getCategoryIcon(category) }}</span>
        <span>{{ category }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CATEGORY_ICONS } from '@/constants/categories';

interface Props {
  categories: string[];
  resultCount?: number;
  showCount?: boolean;
}

interface Emits {
  (e: 'update:selectedCategory', category: string | null): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedCategory = ref<string | null>(null);

function selectCategory(category: string | null) {
  selectedCategory.value = category;
  emit('update:selectedCategory', category);
}

function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] || '';
}
</script>

<style scoped>
.category-filter {
  width: 100%;
}

.filter-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-700);
}

.result-count {
  font-size: 0.813rem;
  font-weight: 500;
  color: var(--color-gray-500);
}

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
}

.category-pill {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background-color: var(--color-white);
  color: var(--color-gray-700);
  border: 2px solid var(--color-gray-300);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.category-icon {
  font-size: 1rem;
  line-height: 1;
}

.category-pill:hover {
  border-color: var(--color-gray-400);
  background-color: var(--color-gray-50);
}

.category-pill:focus {
  outline: none;
  border-color: var(--color-gray-900);
  box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.05);
}

.category-pill.active {
  background-color: var(--color-gray-900);
  color: var(--color-white);
  border-color: var(--color-gray-900);
}

.category-pill.active:hover {
  background-color: var(--color-gray-800);
  border-color: var(--color-gray-800);
}

@media (max-width: 640px) {
  .category-pills {
    gap: 0.5rem;
  }

  .category-pill {
    padding: 0.438rem 0.875rem;
    font-size: 0.813rem;
  }
}
</style>
