<template>
  <div class="category-filter">
    <div class="category-scroll-container">
      <button
        class="category-pill"
        :class="{ active: modelValue === null }"
        @click="selectCategory(null)"
      >
        <span class="category-icon">✨</span>
        <span>All</span>
      </button>
      <button
        v-for="category in categories"
        :key="category"
        class="category-pill"
        :class="{ active: modelValue === category }"
        @click="selectCategory(category)"
      >
        <span v-if="getCategoryIcon(category)" class="category-icon">{{
          getCategoryIcon(category)
        }}</span>
        <span>{{ category }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CATEGORY_ICONS } from '@/constants/categories'

interface Props {
  modelValue: string | null
  categories: string[]
  resultCount?: number
  showCount?: boolean
}

interface Emits {
  (e: 'update:modelValue', category: string | null): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

function selectCategory(category: string | null) {
  emit('update:modelValue', category)
}

function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] || ''
}
</script>

<style scoped>
.category-filter {
  width: 100%;
  margin-bottom: 2rem;
}

.category-scroll-container {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

.category-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.category-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 100px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  flex-shrink: 0; /* Prevent squashing */
  box-shadow: var(--shadow-sm);
}

.category-icon {
  font-size: 1rem;
  line-height: 1;
}

.category-pill:hover {
  border-color: var(--color-gray-400);
  background-color: var(--color-surface-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.category-pill:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-subtle);
}

.category-pill.active {
  background-color: var(--color-black);
  color: var(--color-white);
  border-color: var(--color-black);
  box-shadow: var(--shadow-md);
}

.category-pill.active:hover {
  background-color: var(--color-gray-900);
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}
</style>
