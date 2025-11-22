<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <span class="search-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </span>
      <input
        ref="searchInput"
        type="text"
        :value="modelValue"
        placeholder="Search prompts by title, description, or tags..."
        class="search-input"
        aria-label="Search prompts"
        @input="handleInput"
      />
      <button v-if="modelValue" class="clear-button" aria-label="Clear search" @click="clearSearch">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const searchInput = ref<HTMLInputElement | null>(null)

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function clearSearch() {
  emit('update:modelValue', '')
  searchInput.value?.focus()
}
</script>

<style scoped>
.search-bar {
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 100%;
}

.search-icon {
  position: absolute;
  left: 1rem;
  display: flex;
  align-items: center;
  color: var(--color-gray-500);
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 0.875rem 3rem 0.875rem 3rem;
  border: 2px solid var(--color-gray-300);
  border-radius: 8px;
  font-size: 1rem;
  background-color: var(--color-white);
  color: var(--color-gray-900);
  transition: all 0.2s ease;
}

.search-input::placeholder {
  color: var(--color-gray-400);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-gray-900);
  box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.05);
}

.clear-button {
  position: absolute;
  right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  background-color: transparent;
  color: var(--color-gray-500);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.clear-button:hover {
  color: var(--color-gray-900);
  background-color: var(--color-gray-100);
}

.clear-button:focus {
  outline: 2px solid var(--color-gray-400);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .search-input {
    padding: 0.75rem 2.5rem 0.75rem 2.5rem;
    font-size: 0.938rem;
  }

  .search-icon {
    left: 0.75rem;
  }

  .clear-button {
    right: 0.75rem;
  }
}
</style>
