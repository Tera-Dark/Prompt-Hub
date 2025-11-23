<template>
  <div class="home-container">
    <header class="home-header">
      <div class="container header-content">
        <div class="brand">
          <span class="logo-icon">⚡</span>
          <span class="brand-name">{{ t('app.name') }}</span>
        </div>
        <div class="header-actions">
          <Button variant="ghost" size="sm" @click="toggleLanguage">
            {{ locale === 'en' ? '中文' : 'English' }}
          </Button>
          <div v-if="isAuthenticated" class="user-menu">
            <Button variant="secondary" size="sm" @click="$router.push('/admin')">
              {{ t('nav.dashboard') }}
            </Button>
          </div>
          <div v-else class="auth-buttons">
            <Button variant="primary" size="sm" @click="$router.push('/login')">
              {{ t('nav.login') }}
            </Button>
          </div>
        </div>
      </div>
    </header>

    <main class="home-main">
      <section class="hero-section">
        <div class="container">
          <h1 class="hero-title">{{ t('home.title') }}</h1>
          <p class="hero-subtitle">{{ t('home.subtitle') }}</p>

          <div class="search-wrapper">
            <Input
              v-model="searchQuery"
              :placeholder="t('home.searchPlaceholder')"
              class="hero-input"
            >
              <template #prefix>
                <span class="search-icon">🔍</span>
              </template>
            </Input>
          </div>

          <div class="categories-wrapper">
            <Button
              v-for="cat in categories"
              :key="cat"
              size="sm"
              :variant="selectedCategory === cat ? 'primary' : 'outline'"
              @click="toggleCategory(cat)"
            >
              {{ cat }}
            </Button>
          </div>
        </div>
      </section>

      <section class="content-section">
        <div class="container">
          <div class="results-header">
            <h2 class="section-title">
              {{ selectedCategory || 'All Prompts' }}
            </h2>
            <span class="results-count">{{ filteredPrompts.length }} items</span>
          </div>

          <PromptList :prompts="filteredPrompts" :loading="loading" :error="error" />
        </div>
      </section>
    </main>

    <footer class="home-footer">
      <div class="container">
        <p class="copyright">© {{ new Date().getFullYear() }} {{ t('app.name') }}</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import { loadPrompts, getAllCategories, searchPrompts, type Prompt } from '@/types/prompt'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import PromptList from '@/components/PromptList.vue'

const { t, locale } = useI18n()
const auth = useAuth()

const isAuthenticated = computed(() => auth.isAuthed.value)
const prompts = ref<Prompt[]>([])
const categories = ref<string[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)

onMounted(async () => {
  try {
    loading.value = true
    const data = await loadPrompts()
    prompts.value = data.prompts
    categories.value = getAllCategories(data.prompts)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load prompts'
  } finally {
    loading.value = false
  }
})

const filteredPrompts = computed(() => {
  let result = prompts.value

  if (selectedCategory.value) {
    result = result.filter((p) => p.category === selectedCategory.value)
  }

  if (searchQuery.value) {
    result = searchPrompts(result, searchQuery.value)
  }

  return result
})

function toggleCategory(category: string) {
  if (selectedCategory.value === category) {
    selectedCategory.value = null
  } else {
    selectedCategory.value = category
  }
}

function toggleLanguage() {
  const newLang = locale.value === 'en' ? 'zh' : 'en'
  locale.value = newLang
  localStorage.setItem('prompt-hub::pref::lang', newLang)
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
}

.home-header {
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: var(--text-lg);
  color: var(--color-text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hero-section {
  padding: 4rem 0 3rem;
  text-align: center;
}

.hero-title {
  font-size: var(--text-4xl);
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.hero-subtitle {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto 2.5rem;
}

.search-wrapper {
  max-width: 500px;
  margin: 0 auto 2rem;
}

.search-icon {
  font-size: 1rem;
  opacity: 0.5;
}

.categories-wrapper {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.content-section {
  flex: 1;
  padding: 2rem 0 4rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.section-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.results-count {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  font-family: monospace;
}

.home-footer {
  padding: 2rem 0;
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.copyright {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}
</style>
