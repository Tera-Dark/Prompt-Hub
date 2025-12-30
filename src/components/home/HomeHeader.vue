<template>
  <header class="home-header">
    <div class="container header-content">
      <div class="header-top">
        <div class="brand">
          <button
            v-if="promptStore.hasUpdate"
            class="update-badge"
            :title="t('common.newContentAvailable')"
            @click="handleRefresh"
          >
            <span class="update-dot"></span>
            New
          </button>
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
            v-for="view in views"
            :key="view.id"
            class="nav-item"
            :class="{ active: currentView === view.id }"
            @click="emit('update:currentView', view.id)"
          >
            <Icon :name="view.icon" :size="18" />
            {{ t(view.labelKey) }}
          </button>
        </div>

        <div class="header-center">
          <div class="header-search">
            <Input
              :model-value="searchQuery"
              :placeholder="t('home.searchPlaceholder')"
              class="search-input"
              @update:model-value="emit('update:searchQuery', $event as string)"
              @focus="emit('update:currentView', 'explore')"
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

          <Button variant="primary" size="sm" class="submit-prompt-btn" @click="emit('create')">
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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Icon from '@/components/ui/Icon.vue'

defineProps<{
  currentView: 'recommendations' | 'explore' | 'favorites' | 'ai-painting'
  searchQuery: string
  isAuthenticated: boolean
}>()

const emit = defineEmits<{
  (e: 'update:currentView', view: 'recommendations' | 'explore' | 'favorites' | 'ai-painting'): void
  (e: 'update:searchQuery', query: string): void
  (e: 'create'): void
}>()

const { t, locale } = useI18n()
const mobileMenuOpen = ref(false)
import { usePromptStore } from '@/stores/prompts'
const promptStore = usePromptStore()

async function handleRefresh() {
  await promptStore.fetchPrompts(true)
}

const views = [
  { id: 'recommendations', icon: 'sparkles', labelKey: 'home.nav.featured' },
  { id: 'explore', icon: 'compass-simple', labelKey: 'home.nav.explore' },
  { id: 'ai-painting', icon: 'palette', labelKey: 'home.nav.aiPainting' },
  { id: 'favorites', icon: 'bookmark', labelKey: 'home.nav.favorites' },
] as const

function toggleLanguage() {
  const newLang = locale.value === 'en' ? 'zh' : 'en'
  locale.value = newLang
  localStorage.setItem('prompt-hub::pref::lang', newLang)
}
</script>

<style scoped>
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

.update-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  margin-right: 0.5rem;
  animation: fadeIn 0.3s ease;
}

.update-badge:hover {
  background: var(--color-primary);
  color: white;
}

.update-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
