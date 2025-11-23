<template>
  <div class="home-container">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="brand-badge">{{ t('app.name') }}</div>
        <h1 class="hero-title">
          Discover & Share <br />
          <span class="text-gradient">AI Prompts</span>
        </h1>
        <p class="hero-subtitle">
          The open-source collection of high-quality prompts for ChatGPT, Gemini, Claude, and more.
        </p>

        <div class="hero-search">
          <div class="search-wrapper">
            <Input v-model="searchQuery" placeholder="Search prompts..." class="hero-input">
              <template #prefix>
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
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </template>
            </Input>
          </div>
          <div class="hero-actions">
            <Button
              v-if="!isAuthenticated"
              variant="primary"
              size="lg"
              @click="$router.push('/admin')"
            >
              {{ t('nav.login') }}
            </Button>
            <Button v-else variant="secondary" size="lg" @click="$router.push('/admin')">
              {{ t('nav.dashboard') }}
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <main class="main-content container">
      <div class="content-header">
        <div class="filter-scroll">
          <Button
            v-for="cat in categories"
            :key="cat"
            :variant="selectedCategory === cat ? 'primary' : 'ghost'"
            size="sm"
            class="filter-btn"
            @click="handleCategoryChange(selectedCategory === cat ? null : cat)"
          >
            {{ cat }}
          </Button>
        </div>
        <div class="results-count">{{ filteredPrompts.length }} prompts</div>
      </div>

      <PromptList
        :prompts="filteredPrompts"
        :loading="loading"
        :error="error"
        @retry="fetchPrompts"
      />
    </main>

    <footer class="app-footer">
      <div class="container footer-inner">
        <p>&copy; 2024 Prompt Hub. Open Source.</p>
        <div class="footer-links">
          <a
            href="https://github.com/terobox/Prompt-Hub"
            target="_blank"
            rel="noopener"
            class="footer-link"
          >
            GitHub
          </a>
          <RouterLink to="/admin" class="footer-link">
            {{ isAuthenticated ? t('nav.admin') : t('nav.login') }}
          </RouterLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePrompts } from '@/composables/usePrompts'
import { useAuth } from '@/composables/useAuth'
import PromptList from '@/components/PromptList.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'

const { t } = useI18n()
const { prompts, loading, error, categories, fetchPrompts } = usePrompts()
const auth = useAuth()

const isAuthenticated = computed(() => auth.isAuthed.value)
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
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
}

/* Hero Section */
.hero-section {
  position: relative;
  padding: 6rem 1.5rem 4rem;
  background: linear-gradient(to bottom, var(--color-surface) 0%, var(--color-background) 100%);
  border-bottom: 1px solid var(--color-border);
  overflow: hidden;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  animation: slideUp 0.6s ease-out;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 1rem;
  background-color: var(--color-primary-subtle);
  color: var(--color-primary-dark);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.025em;
  text-transform: uppercase;
}

.hero-title {
  font-size: var(--text-4xl);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}

.text-gradient {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-info) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  max-width: 600px;
  line-height: 1.6;
}

.hero-search {
  width: 100%;
  max-width: 500px;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.search-wrapper {
  width: 100%;
}

.hero-actions {
  display: flex;
  gap: 1rem;
}

/* Main Content */
.main-content {
  flex: 1;
  padding-top: 3rem;
  padding-bottom: 4rem;
}

.content-header {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.filter-scroll {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.filter-scroll::-webkit-scrollbar {
  display: none;
}

.filter-btn {
  white-space: nowrap;
  border-radius: var(--radius-full);
}

.results-count {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  font-weight: 500;
}

/* Footer */
.app-footer {
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: 2rem 0;
  margin-top: auto;
}

.footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.footer-links {
  display: flex;
  gap: 1.5rem;
}

.footer-link {
  color: var(--color-text-secondary);
  transition: color var(--transition-base);
}

.footer-link:hover {
  color: var(--color-primary);
}

@media (min-width: 768px) {
  .hero-section {
    padding: 8rem 1.5rem 6rem;
  }

  .hero-title {
    font-size: 4rem;
  }

  .content-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
