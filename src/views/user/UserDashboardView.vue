<template>
  <div class="page-wrapper">
    <Navbar />
    <div class="user-dashboard">
      <header class="dashboard-header">
        <div class="header-content">
          <h1>{{ t('dashboard.mySubmissions') }}</h1>
          <p>{{ t('dashboard.trackSubmissions') }}</p>
        </div>
        <Button variant="primary" @click="$router.push('/prompts/new')">
          {{ t('prompts.new') }}
        </Button>
      </header>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="userPrompts.length > 0" class="prompts-grid">
        <article v-for="prompt in userPrompts" :key="prompt.id" class="prompt-card">
          <div class="card-header">
            <div class="header-top">
              <span class="category-tag">{{ prompt.category }}</span>
              <span class="status-badge" :class="prompt.status || 'published'">
                {{ getStatusLabel(prompt.status) }}
              </span>
            </div>
            <h3>{{ prompt.title }}</h3>
          </div>

          <p class="description">{{ prompt.description }}</p>

          <div class="card-footer">
            <span class="date">{{ formatDate(prompt.createdAt) }}</span>
            <div class="actions">
              <Button
                v-if="prompt.status === 'published'"
                variant="outline"
                size="sm"
                @click="$router.push(`/prompt/${prompt.id}`)"
              >
                {{ t('common.view') }}
              </Button>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>{{ t('dashboard.noSubmissions') }}</h3>
        <p>{{ t('dashboard.startContributing') }}</p>
        <Button variant="primary" @click="$router.push('/prompts/new')">
          {{ t('prompts.createFirst') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePromptStore } from '@/stores/prompts'
import { useAuth } from '@/composables/useAuth'
import Button from '@/components/ui/Button.vue'
import Navbar from '@/components/layout/Navbar.vue'
import { getUserSubmissions } from '@/repositories/prompts'
import type { Prompt } from '@/types/prompt'

const { t } = useI18n()
const promptStore = usePromptStore()
const { user, token } = useAuth()
const { prompts: allPrompts, isLoading: loadingPrompts } = promptStore

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

const loading = computed(() => loadingPrompts.value || loadingSubmissions.value)

const userPrompts = computed(() => {
  if (!user.value?.login) return []
  const published = allPrompts.value.filter((p) => p.author?.username === user.value?.login)
  return [...pendingSubmissions.value, ...published]
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString()
}

function getStatusLabel(status?: string) {
  if (!status || status === 'published') return 'Published'
  if (status === 'draft') return 'Pending Review'
  if (status === 'archived') return 'Archived'
  return status
}
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background-color: var(--color-background);
}

.user-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

.header-content h1 {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.header-content p {
  color: var(--color-text-secondary);
}

.prompts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.prompt-card {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.prompt-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card-header {
  margin-bottom: 1rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.category-tag {
  font-size: var(--text-xs);
  color: var(--color-primary);
  background: var(--color-surface-hover);
  padding: 0.25rem 0.5rem;
  border-radius: 100px;
}

.status-badge {
  font-size: var(--text-xs);
  padding: 0.25rem 0.5rem;
  border-radius: 100px;
  font-weight: 500;
}

.status-badge.published {
  background: var(--color-green-100);
  color: var(--color-green-700);
}

.status-badge.draft {
  background: var(--color-yellow-100);
  color: var(--color-yellow-700);
}

.status-badge.archived {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
}

h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.date {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--color-border);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  color: var(--color-text-secondary);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
