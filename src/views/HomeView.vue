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
              {{ t('common.actions.new') }}
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
        <!-- Unified View -->
        <Transition name="fade" mode="out-in">
          <div :key="currentView" class="view-container">
            <!-- View Header -->
            <div class="view-header">
              <div class="header-left">
                <h2 class="view-title">{{ viewTitle }}</h2>
                <p class="view-subtitle">{{ viewSubtitle }}</p>

                <CategoryFilter
                  v-if="currentView === 'explore'"
                  v-model="selectedCategory"
                  :categories="categories"
                  class="category-filter-inline"
                />
              </div>

              <div class="header-controls">
                <div class="view-toggle">
                  <button
                    class="toggle-btn"
                    :class="{ active: viewMode === 'grid' }"
                    :title="t('common.viewMode.grid')"
                    @click="viewMode = 'grid'"
                  >
                    <Icon name="grid" :size="20" />
                  </button>
                  <button
                    class="toggle-btn"
                    :class="{ active: viewMode === 'list' }"
                    :title="t('common.viewMode.list')"
                    @click="viewMode = 'list'"
                  >
                    <Icon name="list" :size="20" />
                  </button>
                </div>
              </div>
            </div>

            <div v-if="isLoading" class="prompts-grid">
              <PromptCardSkeleton v-for="i in 8" :key="i" />
            </div>

            <div v-else-if="visiblePrompts.length === 0" class="empty-state">
              <Icon name="search" :size="48" class="empty-icon" />
              <h3>{{ t('common.noResults') }}</h3>
              <p>{{ t('common.tryDifferentSearch') }}</p>
            </div>

            <PromptList
              v-else
              :prompts="visiblePrompts"
              :view-mode="viewMode"
              @select="handlePromptSelect"
            />

            <div v-if="hasMore" class="load-more-container">
              <Button variant="secondary" @click="loadMore">
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
    <MobileBottomNav
      :current-view="currentView"
      @update:view="switchView"
      @create="handleSubmitPrompt"
    />

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
import { useRouter, useRoute } from 'vue-router'
import type { Prompt } from '@/types/prompt'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Icon from '@/components/ui/Icon.vue'

import CategoryFilter from '@/components/prompts/CategoryFilter.vue'
import PromptList from '@/components/prompts/PromptList.vue'
import PromptCardSkeleton from '@/components/prompts/PromptCardSkeleton.vue'
import AIPlaygroundDrawer from '@/components/admin/AIPlaygroundDrawer.vue'
import PromptDetailModal from '@/components/prompts/PromptDetailModal.vue'
import MobileBottomNav from '@/components/layout/MobileBottomNav.vue'
import { recommendationService } from '@/services/recommendations'
import { usePromptStore } from '@/stores/prompts'
import { useDebounce } from '@/composables/useDebounce'

const { t, locale } = useI18n()
const auth = useAuth()
const router = useRouter()
const route = useRoute()
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
const categories = computed(() => promptStore.categories.value)

const viewTitle = computed(() => {
  switch (currentView.value) {
    case 'recommendations':
      return t('home.nav.featured')
    case 'explore':
      return t('home.nav.explore')
    case 'favorites':
      return t('home.nav.favorites')
    default:
      return ''
  }
})

const viewSubtitle = computed(() => {
  switch (currentView.value) {
    case 'recommendations':
      return t('home.hero.subtitle')
    case 'explore':
      return t('home.searchPlaceholder')
    case 'favorites':
      return t('home.nav.favorites') + ' ' + t('nav.prompts')
    default:
      return ''
  }
})

onMounted(async () => {
  try {
    // Check for tab query param
    const tab = route.query.tab as string
    if (tab && ['recommendations', 'explore', 'favorites'].includes(tab)) {
      currentView.value = tab as any
    }

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

function switchView(view: string) {
  if (['recommendations', 'explore', 'favorites'].includes(view)) {
    currentView.value = view as 'recommendations' | 'explore' | 'favorites'
    if (view === 'recommendations') {
      selectedCategory.value = null
      searchQuery.value = ''
    }
    currentPage.value = 1
  }
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
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
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
    left: 0;
    right: auto;
    top: 50%;
    bottom: auto;
    transform: translateY(-50%);
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
    width: auto;
    height: auto;
    padding: 1rem 0.5rem;
    justify-content: center;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-md);
  }

  .playground-trigger .label {
    display: block;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .playground-trigger .icon {
    font-size: 1.5rem;
  }

  .playground-trigger:hover {
    transform: translateY(-50%) translateX(5px);
    background: rgba(255, 255, 255, 0.95);
    padding: 1rem 0.5rem;
  }
}

.playground-trigger:hover {
  background: rgba(255, 255, 255, 0.95);
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

.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  align-self: flex-start;
  margin-top: 0.5rem;
}

.view-toggle {
  display: flex;
  background: var(--color-surface-alt);
  padding: 0.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: var(--color-gray-100);
  color: var(--color-text-secondary);
}

.toggle-btn.active {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.empty-state {
  text-align: center;
  padding: 4rem 0;
  color: var(--color-text-secondary);
}

.empty-icon {
  color: var(--color-text-tertiary);
  margin-bottom: 1rem;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-controls {
    width: 100%;
    justify-content: space-between;
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
