<template>
  <div class="view-header">
    <div class="header-left">
      <h2 class="view-title">{{ title }}</h2>
      <p class="view-subtitle">{{ subtitle }}</p>

      <CategoryFilter
        v-if="currentView === 'explore'"
        :model-value="selectedCategory"
        :categories="categories"
        class="category-filter-inline"
        @update:model-value="emit('update:selectedCategory', $event)"
      />

      <BaseModelFilter
        v-if="currentView === 'ai-painting'"
        :model-value="selectedBaseModel"
        :models="baseModels"
        class="category-filter-inline"
        @update:model-value="emit('update:selectedBaseModel', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import CategoryFilter from '@/components/prompts/CategoryFilter.vue'
import BaseModelFilter from '@/components/prompts/BaseModelFilter.vue'

defineProps<{
  currentView: string
  title: string
  subtitle: string
  selectedCategory: string | null
  selectedBaseModel: string | null
  categories: { name: string; count: number }[]
  baseModels: { name: string; count: number }[]
}>()

const emit = defineEmits<{
  (e: 'update:selectedCategory', value: string | null): void
  (e: 'update:selectedBaseModel', value: string | null): void
}>()
</script>

<style scoped>
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  flex: 1;
  min-width: 300px;
}

.view-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.view-subtitle {
  font-size: 1rem;
  color: var(--color-text-tertiary);
  margin: 0.5rem 0 1rem 0;
}

.category-filter-inline {
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>
