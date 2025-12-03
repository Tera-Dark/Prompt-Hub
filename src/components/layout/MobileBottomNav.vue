<template>
  <nav class="mobile-bottom-nav">
    <button
      class="nav-btn"
      :class="{ active: activeTab === 'recommendations' }"
      @click="handleNav('recommendations')"
    >
      <Icon name="sparkles" :size="24" />
      <span>{{ t('home.nav.featured') }}</span>
    </button>

    <button
      class="nav-btn"
      :class="{ active: activeTab === 'explore' }"
      @click="handleNav('explore')"
    >
      <Icon name="compass-simple" :size="24" />
      <span>{{ t('home.nav.explore') }}</span>
    </button>

    <button
      class="nav-btn"
      :class="{ active: activeTab === 'ai-painting' }"
      @click="handleNav('ai-painting')"
    >
      <Icon name="palette" :size="24" />
      <span>{{ t('home.nav.aiPainting') }}</span>
    </button>

    <button class="nav-btn center-btn" @click="handleCenterClick">
      <div class="plus-circle">
        <Icon name="plus" :size="24" />
      </div>
    </button>

    <button
      class="nav-btn"
      :class="{ active: activeTab === 'favorites' }"
      @click="handleNav('favorites')"
    >
      <Icon name="bookmark" :size="24" />
      <span>{{ t('home.nav.favorites') }}</span>
    </button>

    <button
      class="nav-btn"
      :class="{ active: activeTab === 'dashboard' }"
      @click="handleDashboardClick"
    >
      <Icon name="user" :size="24" />
      <span>{{ isAuthenticated ? t('nav.dashboard') : t('nav.login') }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import Icon from '@/components/ui/Icon.vue'

const props = defineProps<{
  currentView?: string
}>()

const emit = defineEmits<{
  (e: 'update:view', view: string): void
  (e: 'create'): void
}>()

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuth()

const isAuthenticated = computed(() => auth.isAuthed.value)

const activeTab = computed(() => {
  if (route.path.startsWith('/admin') || route.path.startsWith('/dashboard')) {
    return 'dashboard'
  }
  if (route.path.startsWith('/ai-painting')) {
    return 'ai-painting'
  }
  return props.currentView || 'recommendations'
})

function handleNav(view: string) {
  if (route.path !== '/') {
    router.push({ path: '/', query: { tab: view } })
  } else {
    emit('update:view', view)
  }
}

function handleCenterClick() {
  if (route.path !== '/') {
    router.push('/admin/prompts/new')
  } else {
    emit('create')
  }
}

function handleDashboardClick() {
  if (isAuthenticated.value) {
    if (!route.path.startsWith('/admin') && !route.path.startsWith('/dashboard')) {
      router.push('/admin')
    }
  } else {
    router.push('/login')
  }
}
</script>

<style scoped>
.mobile-bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  justify-content: space-around;
  align-items: center;
  z-index: 100; /* Increased z-index */
  padding-bottom: env(safe-area-inset-bottom);
  overflow: visible; /* Allow circle to overflow */
}

@media (max-width: 768px) {
  .mobile-bottom-nav {
    display: flex;
  }
}

.nav-btn {
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
  min-width: 0; /* Prevent flex item from overflowing */
}

.nav-btn.active {
  color: var(--color-primary);
}

.center-btn {
  position: relative;
  overflow: visible;
}

.plus-circle {
  position: absolute;
  top: -25px; /* Move up */
  left: 50%;
  transform: translateX(-50%);
  width: 56px; /* Slightly larger */
  height: 56px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  z-index: 101; /* Ensure above nav */
  border: 4px solid var(--color-surface); /* Add border to match background */
}
</style>
