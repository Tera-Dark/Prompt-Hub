<template>
  <div class="category-filter">
    <div class="category-scroll-container">
      <button
        class="category-pill"
        :class="{ active: modelValue === null }"
        @click="selectModel(null)"
      >
        <span class="category-icon">🎨</span>
        <span>All Models</span>
      </button>
      <button
        v-for="model in models"
        :key="model.name"
        class="category-pill"
        :class="{ active: modelValue === model.name }"
        @click="selectModel(model.name)"
      >
        <span>{{ model.name }} ({{ model.count }})</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Model {
  name: string
  count: number
}

interface Props {
  modelValue: string | null
  models: Model[]
}

interface Emits {
  (e: 'update:modelValue', model: string | null): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

function selectModel(model: string | null) {
  emit('update:modelValue', model)
}
</script>

<style scoped>
.category-filter {
  width: 100%;
  margin-bottom: 2rem;
  position: relative;
}

.category-scroll-container {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding: 0.5rem 0.25rem 1rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
  mask-image: linear-gradient(
    to right,
    transparent,
    black 20px,
    black calc(100% - 20px),
    transparent
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent,
    black 20px,
    black calc(100% - 20px),
    transparent
  );
}

.category-scroll-container::-webkit-scrollbar {
  display: none;
}

.category-pill {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1.2rem;
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 100px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.category-icon {
  font-size: 1.1rem;
  line-height: 1;
  opacity: 0.8;
  transition: transform 0.3s ease;
}

.category-pill:hover {
  border-color: var(--color-gray-300);
  background-color: var(--color-white);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  color: var(--color-black);
}

.category-pill:hover .category-icon {
  transform: scale(1.1);
  opacity: 1;
}

.category-pill:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-subtle);
}

.category-pill.active {
  background-color: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.category-pill.active:hover {
  background-color: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.category-pill.active .category-icon {
  opacity: 1;
}
</style>
