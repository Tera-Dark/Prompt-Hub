<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <div class="header-top">
          <div class="brand">
            <h1 class="app-title">Prompt Hub</h1>
            <p class="app-subtitle">Discover and copy AI prompts for any task</p>
          </div>
          <nav class="app-nav" aria-label="Primary">
            <RouterLink to="/admin" class="nav-link">Admin</RouterLink>
          </nav>
        </div>
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
      <div class="footer-content">
        <p>&copy; 2024 Prompt Hub. All rights reserved.</p>
        <RouterLink to="/admin" class="footer-admin-link">Admin</RouterLink>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePrompts } from '@/composables/usePrompts'
import PromptList from '@/components/PromptList.vue'
import SearchBar from '@/components/SearchBar.vue'
import CategoryFilter from '@/components/CategoryFilter.vue'

const { prompts, loading, error, categories, fetchPrompts } = usePrompts()

const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)

const filteredPrompts = computed(() => {
  let result = prompts.value

  if (selectedCategory.value) {
    result = result.filter((prompt) => prompt.category === selectedCategory.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (prompt) =>
        prompt.title.toLowerCase().includes(query) ||
        prompt.description.toLowerCase().includes(query) ||
        prompt.prompt.toLowerCase().includes(query) ||
        prompt.tags.some((tag) => tag.toLowerCase().includes(query)),
    )
  }

  return result
})

function handleCategoryChange(category: string | null) {
  selectedCategory.value = category
}

onMounted(() => {
  fetchPrompts()
})
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

.header-top {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.app-title {
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.app-subtitle {
  font-size: 1.125rem;
  color: var(--color-gray-400);
  font-weight: 400;
}

.app-nav {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: var(--text-sm);
  color: var(--color-white);
  border: 1px solid var(--color-gray-800);
  border-radius: var(--radius-md);
  padding: 0.5rem 1rem;
  transition: background-color var(--transition-base), color var(--transition-base), border-color var(--transition-base);
}

.nav-link:hover,
.nav-link:focus-visible {
  background-color: var(--color-gray-800);
  border-color: var(--color-gray-700);
  color: var(--color-white);
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
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-gray-300);
  box-shadow: var(--shadow-sm);
}

.app-footer {
  background-color: var(--color-gray-900);
  color: var(--color-gray-500);
  padding: 2rem 1.5rem;
  border-top: 1px solid var(--color-gray-800);
}

.footer-content {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
}

.app-footer p {
  font-size: 0.875rem;
  margin: 0;
}

.footer-admin-link {
  font-size: var(--text-sm);
  color: var(--color-gray-300);
  border-bottom: 1px solid transparent;
  padding-bottom: 0.125rem;
  transition: color var(--transition-base), border-color var(--transition-base);
}

.footer-admin-link:hover,
.footer-admin-link:focus-visible {
  color: var(--color-white);
  border-color: var(--color-white);
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

@media (min-width: 768px) {
  .header-top {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .app-nav {
    justify-content: flex-end;
  }
}

@media (min-width: 1400px) {
  .content-wrapper {
    max-width: 1400px;
  }

  .footer-content {
    max-width: 1400px;
  }
}
</style>
