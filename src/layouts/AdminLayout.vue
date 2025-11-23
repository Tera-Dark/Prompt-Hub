<template>
  <div class="admin-shell">
    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="closeSidebar" />

    <aside :class="['admin-sidebar', { 'is-open': sidebarOpen }]">
      <div class="sidebar-header">
        <span class="sidebar-logo">
          {{ t('app.name') }}
        </span>
        <button
          type="button"
          class="sidebar-close"
          aria-label="Close navigation"
          @click="closeSidebar"
        >
          ✕
        </button>
      </div>
      <nav v-if="hasRepoWriteAccess" class="sidebar-nav" aria-label="Admin">
        <RouterLink
          v-for="item in navigation"
          :key="item.key"
          :to="item.to"
          class="sidebar-link"
          :class="{ 'is-active': item.match.test(route.path) }"
          @click="closeSidebar"
        >
          <span>{{ t(`nav.${item.key}`) }}</span>
        </RouterLink>
      </nav>
    </aside>

    <div class="admin-workspace">
      <header class="admin-header">
        <div class="header-left">
          <button
            type="button"
            class="menu-toggle"
            aria-label="Toggle navigation"
            @click="toggleSidebar"
          >
            ☰
          </button>
          <h1 class="context-title">{{ t(`nav.${currentSectionKey}`) }}</h1>
        </div>

        <div class="header-actions">
          <Button variant="ghost" size="sm" @click="toggleLanguage">
            {{ locale === 'en' ? '中文' : 'English' }}
          </Button>
          <Button variant="ghost" size="sm" @click="$router.push('/')">
            {{ t('auth.returnToPublic') }}
          </Button>

          <div v-if="isAuthenticated" class="user-menu-wrapper" @click.stop>
            <button
              type="button"
              class="user-menu-trigger"
              :aria-expanded="userMenuOpen"
              aria-haspopup="true"
              @click="toggleUserMenu"
            >
              <span class="user-name">{{ currentUser?.name || currentUser?.login || 'User' }}</span>
            </button>

            <div v-if="userMenuOpen" class="user-dropdown" @click.stop>
              <div class="dropdown-header">
                <div class="dropdown-user-info">
                  <strong>{{ currentUser?.name || currentUser?.login }}</strong>
                  <span class="dropdown-email">{{ currentUser?.email || currentUser?.login }}</span>
                </div>
              </div>
              <div class="dropdown-divider"></div>
              <nav class="dropdown-nav">
                <button type="button" class="dropdown-link" @click="handleLogout">
                  <span>{{ t('auth.signOut') }}</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main class="admin-content">
        <RouterView v-if="isAuthenticated && hasRepoWriteAccess" />
        <div v-else class="auth-gate-message">Access Restricted</div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/Button.vue'

type NavigationItem = {
  key: string
  to: { name: string }
  match: RegExp
}

const navigation: NavigationItem[] = [
  { key: 'dashboard', to: { name: 'AdminDashboard' }, match: /^\/admin(?:\/dashboard)?$/ },
  { key: 'prompts', to: { name: 'AdminPrompts' }, match: /^\/admin\/prompts(\/.*)?$/ },
  { key: 'review', to: { name: 'AdminReview' }, match: /^\/admin\/review$/ },
  { key: 'data', to: { name: 'AdminData' }, match: /^\/admin\/data$/ },
  { key: 'aiSettings', to: { name: 'AdminAISettings' }, match: /^\/admin\/ai-settings$/ },
]

const route = useRoute()
const sidebarOpen = ref(false)
const userMenuOpen = ref(false)
const auth = useAuth()
const { t, locale } = useI18n()

const isAuthenticated = computed(() => auth.isAuthed.value)
const hasRepoWriteAccess = computed(() => auth.hasRepoWriteAccess.value)
const currentUser = computed(() => auth.user.value)

const currentSectionKey = computed(() => {
  const found = navigation.find((item) => item.match.test(route.path))
  return found?.key ?? 'admin'
})

watch(
  () => route.path,
  () => {
    sidebarOpen.value = false
    userMenuOpen.value = false
  },
)

if (typeof window !== 'undefined') {
  window.addEventListener('click', () => {
    userMenuOpen.value = false
  })
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function handleLogout() {
  userMenuOpen.value = false
  auth.logout()
}

function toggleLanguage() {
  const newLang = locale.value === 'en' ? 'zh' : 'en'
  locale.value = newLang
  localStorage.setItem('prompt-hub::pref::lang', newLang)
}
</script>

<style scoped>
.admin-shell {
  min-height: 100vh;
  display: flex;
  background-color: var(--color-background);
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 20;
}

.admin-sidebar {
  width: 240px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  transition: transform var(--transition-base);
  z-index: 30;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 3rem;
}

.sidebar-logo {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.sidebar-close {
  display: none;
  font-size: 1.5rem;
  color: var(--color-text-primary);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sidebar-link {
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: color var(--transition-base);
  border-right: 2px solid transparent;
}

.sidebar-link:hover {
  color: var(--color-text-primary);
}

.sidebar-link.is-active {
  color: var(--color-text-primary);
  border-right-color: var(--color-text-primary);
}

.admin-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-width: 0;
}

.admin-header {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.menu-toggle {
  display: none;
  font-size: 1.5rem;
  color: var(--color-text-primary);
}

.context-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-menu-wrapper {
  position: relative;
}

.user-menu-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem;
  transition: opacity var(--transition-base);
}

.user-menu-trigger:hover {
  opacity: 0.7;
}

.user-name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-primary);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 240px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  z-index: 50;
  padding: 0.5rem;
}

.dropdown-header {
  padding: 0.75rem;
}

.dropdown-user-info strong {
  display: block;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
}

.dropdown-email {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.5rem 0;
}

.dropdown-link {
  width: 100%;
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  transition: all var(--transition-base);
}

.dropdown-link:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.admin-content {
  flex: 1;
  padding: 2rem;
  background-color: var(--color-surface-alt);
}

@media (max-width: 1024px) {
  .admin-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    transform: translateX(-100%);
  }

  .admin-sidebar.is-open {
    transform: translateX(0);
  }

  .sidebar-close,
  .menu-toggle {
    display: block;
  }
}
</style>
