<template>
  <section class="dashboard">
    <header class="dashboard-header">
      <h2>{{ t('dashboard.title') }}</h2>
      <p>{{ t('dashboard.subtitle') }}</p>
    </header>

    <div class="stats-grid">
      <article v-for="stat in stats" :key="stat.label" class="stat-card">
        <span class="stat-label">{{ stat.label }}</span>
        <span class="stat-value">{{ stat.value }}</span>
        <span class="stat-meta">{{ stat.meta }}</span>
      </article>
    </div>

    <div class="panels-grid">
      <article class="panel recent-panel">
        <h3>{{ t('dashboard.panels.recent') }}</h3>
        <div v-if="recentPrompts.length > 0" class="recent-list">
          <div v-for="prompt in recentPrompts" :key="prompt.id" class="recent-item">
            <div class="recent-info">
              <span class="recent-title">{{ prompt.title }}</span>
              <span class="recent-date">{{ formatDate(prompt.createdAt) }}</span>
            </div>
            <span class="status-badge" :class="prompt.status || 'published'">
              {{ getStatusLabel(prompt.status) }}
            </span>
          </div>
        </div>
        <p v-else class="empty-text">{{ t('prompts.noPrompts') }}</p>
      </article>

      <!-- Removed Moderation Panel for regular users -->
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePromptStore } from '@/stores/prompts'
import { useAuth } from '@/composables/useAuth'
import { getUserSubmissions } from '@/repositories/prompts'
import type { Prompt } from '@/types/prompt'

const { t } = useI18n()
const promptStore = usePromptStore()
const { user, token } = useAuth()
const { prompts: allPrompts } = promptStore

const pendingSubmissions = ref<Prompt[]>([])
const loadingSubmissions = ref(false)

onMounted(async () => {
  promptStore.fetchPrompts()
  if (user.value?.login && token.value) {
    loadingSubmissions.value = true
    try {
      pendingSubmissions.value = await getUserSubmissions(user.value.login, token.value)
    } catch (e) {
      console.error('Failed to load submissions', e)
    } finally {
      loadingSubmissions.value = false
    }
  }
})

const userPrompts = computed(() => {
  if (!user.value?.login) return []
  const published = allPrompts.value.filter((p) => p.author?.username === user.value?.login)
  return [...pendingSubmissions.value, ...published]
})

const publishedCount = computed(
  () => userPrompts.value.filter((p) => p.status === 'published' || !p.status).length,
)

const pendingCount = computed(() => userPrompts.value.filter((p) => p.status === 'draft').length)

// For users, "New" could mean prompts created in the last 7 days
const newCount = computed(() => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return userPrompts.value.filter((p) => new Date(p.createdAt) > sevenDaysAgo).length
})

const recentPrompts = computed(() => {
  return [...userPrompts.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
})

const stats = computed(() => [
  {
    label: t('dashboard.stats.published'),
    value: publishedCount.value.toString(),
    meta: t('dashboard.stats.meta.total'),
  },
  {
    label: t('dashboard.stats.pending'),
    value: pendingCount.value.toString(),
    meta: t('dashboard.stats.meta.review'),
  },
  {
    label: t('dashboard.stats.new'),
    value: newCount.value.toString(),
    meta: t('dashboard.stats.meta.days'),
  },
])

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString()
}

function getStatusLabel(status?: string) {
  if (!status || status === 'published') return t('common.status.published')
  if (status === 'draft') return t('common.status.draft')
  if (status === 'archived') return t('common.status.archived')
  return status
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.dashboard-header h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-gray-900);
}

.dashboard-header p {
  margin-top: 0.5rem;
  color: var(--color-gray-500);
}

.stats-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.stat-card {
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: var(--shadow-sm);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-text-primary);
}

.stat-meta {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.panels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.panel {
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.recent-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}

.recent-title {
  font-weight: 500;
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-date {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.status-badge {
  font-size: var(--text-xs);
  padding: 0.25rem 0.5rem;
  border-radius: 100px;
  font-weight: 500;
}

.status-badge.published {
  background-color: var(--color-green-100);
  color: var(--color-green-700);
}

.status-badge.draft {
  background-color: var(--color-yellow-100);
  color: var(--color-yellow-700);
}

.status-badge.archived {
  background-color: var(--color-gray-100);
  color: var(--color-gray-700);
}

.empty-text {
  color: var(--color-text-tertiary);
  font-style: italic;
}
</style>
