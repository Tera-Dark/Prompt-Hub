<template>
  <div class="home-container">
    <HomeHeader
      :current-view="currentView"
      :search-query="searchQuery"
      :is-authenticated="isAuthenticated"
      @update:current-view="switchView"
      @update:search-query="searchQuery = $event"
      @create="handleSubmitPrompt"
    />

    <main class="home-main">
      <div class="container content-area">
        <!-- Unified View -->
        <Transition name="fade" mode="out-in">
          <div :key="currentView" class="view-container">
            <HomeSubHeader
              :current-view="currentView"
              :title="viewTitle"
              :subtitle="viewSubtitle"
              :selected-category="selectedCategory"
              :selected-base-model="selectedBaseModel"
              :categories="categories"
              :base-models="baseModels"
              @update:selected-category="selectedCategory = $event"
              @update:selected-base-model="selectedBaseModel = $event"
            />

            <div v-if="isLoading" class="prompts-grid">
              <PromptCardSkeleton v-for="i in 8" :key="i" />
            </div>

            <div v-else-if="filteredPrompts.length === 0" class="empty-state">
              <Icon name="search" :size="48" class="empty-icon" />
              <h3>{{ t('common.noResults') }}</h3>
              <p>{{ t('common.tryDifferentSearch') }}</p>
            </div>

            <PromptList v-else :prompts="filteredPrompts" @select="handlePromptSelect" />
          </div>
        </Transition>
      </div>
    </main>

    <HomeFooter />

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
import Icon from '@/components/ui/Icon.vue'

import PromptList from '@/components/prompts/PromptList.vue'
import PromptCardSkeleton from '@/components/prompts/PromptCardSkeleton.vue'
import AIPlaygroundDrawer from '@/components/admin/AIPlaygroundDrawer.vue'
import PromptDetailModal from '@/components/prompts/PromptDetailModal.vue'
import MobileBottomNav from '@/components/layout/MobileBottomNav.vue'
import { recommendationService } from '@/services/recommendations'
import { usePromptStore } from '@/stores/prompts'
import { useDebounce } from '@/composables/useDebounce'

// New Components
import HomeHeader from '@/components/home/HomeHeader.vue'
import HomeSubHeader from '@/components/home/HomeSubHeader.vue'
import HomeFooter from '@/components/home/HomeFooter.vue'

const { t } = useI18n()
const auth = useAuth()
const router = useRouter()
const route = useRoute()
const promptStore = usePromptStore()

const isAuthenticated = computed(() => auth.isAuthed.value)

const searchQuery = ref('')
const debouncedSearchQuery = useDebounce(searchQuery, 300)
const selectedCategory = ref<string | null>(null)
const selectedBaseModel = ref<string | null>(null)
const showPlayground = ref(false)
const selectedPrompt = ref<Prompt | null>(null)
const currentView = ref<'recommendations' | 'explore' | 'favorites' | 'ai-painting'>(
  'recommendations',
)

const isLoading = computed(() => promptStore.isLoading.value)
const categories = computed(() => promptStore.categories.value)
const baseModels = computed(() => promptStore.baseModels.value)

const viewTitle = computed(() => {
  switch (currentView.value) {
    case 'recommendations':
      return t('home.nav.featured')
    case 'explore':
      return t('home.nav.explore')
    case 'favorites':
      return t('home.nav.favorites')
    case 'ai-painting':
      return t('home.nav.aiPainting')
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
    case 'ai-painting':
      return 'Explore AI-generated masterpieces'
    default:
      return ''
  }
})

onMounted(async () => {
  try {
    // Check for tab query param
    const tab = route.query.tab as string
    if (tab && ['recommendations', 'explore', 'favorites', 'ai-painting'].includes(tab)) {
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
    currentView.value as 'recommendations' | 'explore' | 'favorites' | 'ai-painting',
    selectedBaseModel.value,
  )
})

function switchView(view: string) {
  if (['recommendations', 'explore', 'favorites', 'ai-painting'].includes(view)) {
    currentView.value = view as 'recommendations' | 'explore' | 'favorites' | 'ai-painting'
    if (view === 'recommendations') {
      selectedCategory.value = null
      selectedBaseModel.value = null
      searchQuery.value = ''
    }
  }
}

watch([debouncedSearchQuery, selectedCategory, currentView], () => {
  if (debouncedSearchQuery.value) {
    currentView.value = 'explore'
  }
})

function handlePromptSelect(prompt: Prompt) {
  recommendationService.trackInteraction(prompt)
  if (prompt.category === 'AI Painting' || prompt.category === 'AI 绘画') {
    router.push(`/ai-painting/${prompt.id}`)
  } else {
    selectedPrompt.value = prompt
  }
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

.content-area {
  padding-top: 3rem;
  padding-bottom: 5rem;
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

  .content-area {
    padding-bottom: 80px;
  }
}
</style>
