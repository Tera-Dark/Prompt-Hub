<template>
  <div class="view-toggle">
    <button
      class="toggle-btn"
      :class="{ active: modelValue === 'grid' }"
      title="Grid View"
      @click="$emit('update:modelValue', 'grid')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    </button>
    <button
      class="toggle-btn"
      :class="{ active: modelValue === 'list' }"
      title="List View"
      @click="$emit('update:modelValue', 'list')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: 'grid' | 'list'
}>()

defineEmits<{
  (e: 'update:modelValue', value: 'grid' | 'list'): void
}>()
</script>

<style scoped>
.view-toggle {
  display: flex;
  background: var(--color-surface-alt);
  padding: 0.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  gap: 0.25rem;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  transition: all 0.2s ease;
  border: none;
  background: transparent;
  cursor: pointer;
}

.toggle-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-hover);
}

.toggle-btn.active {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}
</style>
