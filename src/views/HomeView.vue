<template>
  <div class="home-container">
    <header class="home-header">
      <div class="container header-content">
        <div class="header-top">
          <div class="brand">
            <span class="logo-icon">⚡</span>
            <span class="brand-name">{{ t('app.name') }}</span>
          </div>
          <button
            class="mobile-menu-toggle visible-mobile"
            aria-label="Toggle navigation"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <Icon :name="mobileMenuOpen ? 'x' : 'menu'" :size="24" />
          </button>
        </div>

        <div class="header-main" :class="{ 'is-open': mobileMenuOpen }">
          <div class="header-nav">
            <button
              class="nav-item"
              :class="{ active: currentView === 'recommendations' }"
              @click="switchView('recommendations')"
            >
              <Icon name="sparkles" :size="18" />
              {{ t('home.nav.featured') }}
            </button>
            <button
              class="nav-item"
              :class="{ active: currentView === 'explore' }"
              @click="switchView('explore')"
            >
              <Icon name="compass-simple" :size="18" />
              {{ t('home.nav.explore') }}
            </button>
            <button
              class="nav-item"
              :class="{ active: currentView === 'favorites' }"
              @click="switchView('favorites')"
            >
              <Icon name="bookmark" :size="18" />
              {{ t('home.nav.favorites') }}
            </button>
          </div>

          <div class="header-center">
            <div class="header-search">
              <Input
                v-model="searchQuery"
                :placeholder="t('home.searchPlaceholder')"
                class="search-input"
                @focus="switchView('explore')"
              >
                <template #prefix>
                  <span class="search-icon">🔍</span>
                </template>
              </Input>
            </div>
          </div>

          <div class="header-actions">
            <Button variant="ghost" size="sm" @click="toggleLanguage">
              {{ locale === 'en' ? '中文' : 'English' }}
            </Button>

            <Button
              variant="primary"
              size="sm"
              class="submit-prompt-btn"
              @click="handleSubmitPrompt"
            >
              <Icon name="plus" :size="16" />
              {{ t('nav.prompts') }}
            </Button>

            <div v-if="isAuthenticated" class="user-menu">
              <Button variant="secondary" size="sm" @click="$router.push('/admin')">
                <Icon name="layout-dashboard" :size="16" />
                {{ t('nav.dashboard') }}
              </Button>
            </div>
            <div v-else class="auth-buttons">
              <Button variant="secondary" size="sm" @click="$router.push('/login')">
                <Icon name="log-in" :size="16" />
                {{ t('nav.login') }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="home-main">
      <div class="container content-area">
        <!-- Recommendations View -->
        <Transition name="fade" mode="out-in">
          <div v-if="currentView === 'recommendations'" key="recs">
            <RecommendationSection
              :prompts="featuredPrompts"
              :loading="isLoading"
              @select="handlePromptSelect"
            />
          </div>

          <!-- Explore View -->
          <div v-else key="explore" class="explore-view">
            <div class="explore-header">
              <CategoryFilter v-model="selectedCategory" :categories="categories" />
            </div>

            <div v-if="isLoading" class="prompts-grid">
              <PromptCardSkeleton v-for="i in 6" :key="i" />
            </div>

            <PromptList
              v-else
              :prompts="visiblePrompts"
              :view-mode="viewMode"
              @select="handlePromptSelect"
            />

            <div v-if="hasMore" class="load-more-container">
              <Button variant="outline" @click="loadMore">
                {{ t('common.loadMore') }}
              </Button>
            </div>
          </div>
        </Transition>
      </div>
    </main>

    <footer class="home-footer">
      <div class="container">
        <p class="copyright">© {{ new Date().getFullYear() }} {{ t('app.name') }}</p>
      </div>
    </footer>

    <!-- Floating AI Playground Trigger -->
    <button
      class="playground-trigger"
      :title="t('playground.title')"
      @click="showPlayground = true"
    >
      <span class="icon">⚡</span>
      <span class="label">{{ t('playground.title') }}</span>
    </button>

    <AIPlaygroundDrawer
      :is-open="showPlayground"
      prompt-template=""
      @close="showPlayground = false"
    />

    <!-- Mobile Bottom Navigation -->
    <nav class="mobile-bottom-nav">
      <button
        class="nav-btn"
        :class="{ active: currentView === 'recommendations' }"
        @click="switchView('recommendations')"
      >
        <Icon name="sparkles" :size="24" />
        <span>{{ t('home.nav.featured') }}</span>
      </button>

      <button
        class="nav-btn"
        :class="{ active: currentView === 'explore' }"
        @click="switchView('explore')"
      >
        <Icon name="compass-simple" :size="24" />
        <span>{{ t('home.nav.explore') }}</span>
      </button>

      <button class="nav-btn center-btn" @click="handleSubmitPrompt">
        <div class="plus-circle">
          <Icon name="plus" :size="24" />
        </div>
      </button>

      <button
        class="nav-btn"
        :class="{ active: currentView === 'favorites' }"
        @click="switchView('favorites')"
      >
        <Icon name="bookmark" :size="24" />
        <span>{{ t('home.nav.favorites') }}</span>
      </button>

      <button class="nav-btn" @click="handleUserAction">
        <Icon name="user" :size="24" />
        <span>{{ isAuthenticated ? t('nav.dashboard') : t('nav.login') }}</span>
      </button>
    </nav>

    <PromptDetailModal
      v-if="selectedPrompt"
      :is-open="!!selectedPrompt"
      :prompt="selectedPrompt"
      @close="selectedPrompt = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import type { Prompt } from '@/types/prompt'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Icon from '@/components/ui/Icon.vue'

import CategoryFilter from '@/components/prompts/CategoryFilter.vue'
import PromptList from '@/components/prompts/PromptList.vue'
import PromptCardSkeleton from '@/components/prompts/PromptCardSkeleton.vue'
import AIPlaygroundDrawer from '@/components/admin/AIPlaygroundDrawer.vue'
import RecommendationSection from '@/components/home/RecommendationSection.vue'
import PromptDetailModal from '@/components/prompts/PromptDetailModal.vue'
import { recommendationService } from '@/services/recommendations'
import { usePromptStore } from '@/stores/prompts'
import { useDebounce } from '@/composables/useDebounce'

const { t, locale } = useI18n()
const auth = useAuth()
const router = useRouter()
const promptStore = usePromptStore()

const isAuthenticated = computed(() => auth.isAuthed.value)

const searchQuery = ref('')
const debouncedSearchQuery = useDebounce(searchQuery, 300)
const selectedCategory = ref<string | null>(null)
const showPlayground = ref(false)
const mobileMenuOpen = ref(false)
const selectedPrompt = ref<Prompt | null>(null)
const currentView = ref<'recommendations' | 'explore' | 'favorites'>('recommendations')
const viewMode = ref<'grid' | 'list'>('grid')

// Pagination
const PAGE_SIZE = 24
const currentPage = ref(1)

const isLoading = computed(() => promptStore.isLoading.value)
const featuredPrompts = computed(() => promptStore.featuredPrompts.value)
const categories = computed(() => promptStore.categories.value)

onMounted(async () => {
  try {
    // auth is auto-initialized
    await promptStore.fetchPrompts()
  } catch (e) {
    console.error('Failed to init:', e)
  }
})

const filteredPrompts = computed(() => {
  return promptStore.getFilteredPrompts(
    debouncedSearchQuery.value,
    selectedCategory.value,
    currentView.value,
  )
})

const visiblePrompts = computed(() => {
  return filteredPrompts.value.slice(0, currentPage.value * PAGE_SIZE)
})

const hasMore = computed(() => {
  return visiblePrompts.value.length < filteredPrompts.value.length
})

function loadMore() {
  currentPage.value++
}

function switchView(view: 'recommendations' | 'explore' | 'favorites') {
  currentView.value = view
  if (view === 'recommendations') {
    selectedCategory.value = null
    searchQuery.value = ''
  }
  currentPage.value = 1
}

watch([debouncedSearchQuery, selectedCategory, currentView], () => {
  currentPage.value = 1
  if (debouncedSearchQuery.value) {
    currentView.value = 'explore'
  }
})

function handlePromptSelect(prompt: Prompt) {
  recommendationService.trackInteraction(prompt)
  selectedPrompt.value = prompt
}

function toggleLanguage() {
  const newLang = locale.value === 'en' ? 'zh' : 'en'
  locale.value = newLang
  localStorage.setItem('prompt-hub::pref::lang', newLang)
}

function handleSubmitPrompt() {
  if (isAuthenticated.value) {
    router.push('/admin/prompts/new')
  } else {
    router.push('/login')
  }
}

function handleUserAction() {
  if (isAuthenticated.value) {
    router.push('/admin')
  } else {
    router.push('/login')
  }
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
  align-items: center;
  gap: 1rem;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: auto;
}

.header-main {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: space-between;
  gap: 1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: var(--text-lg);
  color: var(--color-text-primary);
  white-space: nowrap;
}

.header-nav {
  display: flex;
  gap: 1.5rem;
  margin-left: 2rem;
}

.nav-item {
  background: none;
  border: none;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.5rem 0;
  position: relative;
  transition: color var(--transition-base);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.nav-item:hover {
  color: var(--color-text-primary);
}

.nav-item.active {
  color: var(--color-primary);
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--color-primary);
  border-radius: 2px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 1rem;
  max-width: 500px;
}

.header-search {
  width: 100%;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.search-icon {
  font-size: 1rem;
  opacity: 0.5;
}

.mobile-menu-toggle {
  display: none;
  background: none;
  border: none;
  color: var(--color-text-primary);
  cursor: pointer;
  padding: 0.5rem;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }

  .header-top {
    width: 100%;
    padding: 0.5rem 0;
  }

  .mobile-menu-toggle {
    display: block;
  }

  .header-main {
    display: none;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
    margin-top: 0.5rem;
  }

  .header-main.is-open {
    display: flex;
  }

  .header-nav {
    margin-left: 0;
    flex-direction: column;
    gap: 0.5rem;
  }

  .nav-item {
    width: 100%;
    padding: 0.75rem;
    border-radius: var(--radius-md);
  }

  .nav-item:hover {
    background-color: var(--color-surface-hover);
  }

  .nav-item.active::after {
    display: none;
  }

  .nav-item.active {
    background-color: var(--color-surface-active);
  }

  .header-center {
    padding: 0;
    max-width: none;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .header-actions > * {
    width: 100%;
  }
}

.content-area {
  padding-top: 3rem;
  padding-bottom: 5rem;
}

.categories-wrapper {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 0.5rem;
  margin-bottom: 2rem;
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

.playground-trigger {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: none;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  padding: 1rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: all var(--transition-base);
  z-index: 40;
}

@media (max-width: 768px) {
  .playground-trigger {
    left: auto;
    right: 1.5rem;
    top: auto;
    bottom: 1.5rem;
    transform: none;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    width: 56px;
    height: 56px;
    padding: 0;
    justify-content: center;
    background: var(--color-primary);
    color: white;
    box-shadow: var(--shadow-lg);
  }

  .playground-trigger .label {
    display: none;
  }

  .playground-trigger .icon {
    font-size: 1.75rem;
  }

  .playground-trigger:hover {
    transform: scale(1.05);
    background: var(--color-primary-dark);
    padding: 0;
  }
}

.playground-trigger:hover {
  background: var(--color-surface-hover);
  padding-right: 1rem;
  transform: translateY(-50%) translateX(5px);
}

.playground-trigger .icon {
  font-size: 1.5rem;
}

.playground-trigger .label {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.load-more-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding-bottom: 2rem;
}

/* Mobile Bottom Navigation Styles */
.mobile-bottom-nav {
  display: none;
}

@media (max-width: 768px) {
  .mobile-bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 60px;
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    justify-content: space-around;
    align-items: center;
    z-index: 50;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .mobile-bottom-nav .nav-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: 0.5rem 0;
    color: var(--color-text-tertiary);
    font-size: 10px;
    gap: 2px;
    cursor: pointer;
  }

  .mobile-bottom-nav .nav-btn.active {
    color: var(--color-primary);
  }

  .mobile-bottom-nav .center-btn {
    position: relative;
    top: -15px;
  }

  .mobile-bottom-nav .plus-circle {
    width: 48px;
    height: 48px;
    background: var(--color-primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }

  /* Hide original mobile menu toggle */
  .mobile-menu-toggle {
    display: none;
  }

  /* Adjust Content Padding for Bottom Nav */
  .content-area {
    padding-bottom: 80px;
  }

  /* Make Search visible on mobile header */
  .header-main {
    display: flex !important; /* Force display */
    padding-top: 0;
    border-top: none;
    margin-top: 0;
  }

  .header-nav,
  .header-actions {
    display: none !important; /* Hide nav items and actions, used in bottom nav */
  }

  .header-center {
    display: block;
    width: 100%;
    max-width: none;
    padding: 0;
  }
}
</style>
