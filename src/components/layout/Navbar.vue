<template>
  <header class="home-header">
    <div class="container header-content">
      <div class="header-top">
        <div class="brand" style="cursor: pointer" @click="$router.push('/')">
          <span class="logo-icon">⚡</span>
          <span class="brand-name">{{ t('app.name') }}</span>
        </div>
        <button class="mobile-menu-toggle" @click="mobileMenuOpen = !mobileMenuOpen">
          <Icon name="menu" />
        </button>
      </div>

      <div class="header-main" :class="{ 'is-open': mobileMenuOpen }">
        <div class="header-nav">
          <slot name="nav"></slot>
        </div>

        <div class="header-center">
          <slot name="center"></slot>
        </div>

        <div class="header-actions">
          <Button variant="ghost" size="sm" @click="toggleLanguage">
            {{ locale === 'en' ? '中文' : 'English' }}
          </Button>

          <template v-if="isAuthenticated">
            <Button
              v-if="!isDashboard"
              variant="secondary"
              size="sm"
              @click="$router.push('/dashboard')"
            >
              <Icon name="layout-dashboard" :size="16" />
              {{ t('nav.dashboard') }}
            </Button>
            <Button v-else variant="secondary" size="sm" @click="$router.push('/')">
              <Icon name="home" :size="16" />
              {{ t('nav.home') }}
            </Button>

            <Button variant="ghost" size="sm" @click="handleLogout">
              {{ t('auth.signOut') }}
            </Button>
          </template>

          <template v-else>
            <Button variant="secondary" size="sm" @click="$router.push('/login')">
              <Icon name="log-in" :size="16" />
              {{ t('auth.signIn') }}
            </Button>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import Button from '@/components/ui/Button.vue'
import Icon from '@/components/ui/Icon.vue'

const { t, locale } = useI18n()
const auth = useAuth()
const router = useRouter()
const route = useRoute()
const mobileMenuOpen = ref(false)

const isAuthenticated = computed(() => auth.isAuthed.value)
const isDashboard = computed(() => route.path.startsWith('/dashboard'))

function toggleLanguage() {
  const newLang = locale.value === 'en' ? 'zh' : 'en'
  locale.value = newLang
  localStorage.setItem('prompt-hub::pref::lang', newLang)
}

function handleLogout() {
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
/* Copied styles from HomeView.vue */
.home-header {
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-background);
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

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 1rem;
  max-width: 500px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
</style>
