<template>
  <section class="review">
    <header class="review-header">
      <h2>{{ t('review.title') }}</h2>
      <p>{{ t('review.subtitle') }}</p>
    </header>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-else>
      <div class="pr-list">
        <article v-for="prompt in pendingPrompts" :key="prompt.id" class="pr-card">
          <div class="card-header">
            <h3>{{ prompt.title }}</h3>
            <span class="badge" data-state="pending">{{ t('review.status.pending') }}</span>
          </div>
          <div class="card-content">
            <p class="prompt-text">{{ prompt.prompt }}</p>
            <div class="tags">
              <span v-for="tag in prompt.tags" :key="tag" class="tag">#{{ tag }}</span>
            </div>
          </div>
          <div class="card-actions">
            <Button variant="outline" size="sm" @click="handleReject(prompt.id)">
              {{ t('review.reject') }}
            </Button>
            <Button variant="primary" size="sm" @click="handleApprove(prompt.id)">
              {{ t('review.approve') }}
            </Button>
          </div>
          <div class="card-meta">
            <span class="date">{{ formatDate(prompt.createdAt) }}</span>
          </div>
        </article>
        <div v-if="!pendingPrompts.length" class="empty">{{ t('review.empty') }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePromptStore } from '@/stores/prompts'
import Button from '@/components/ui/Button.vue'

const { t } = useI18n()
const promptStore = usePromptStore()
const { prompts: allPrompts, isLoading: loading } = promptStore

onMounted(() => {
  promptStore.fetchPrompts()
})

const pendingPrompts = computed(() => allPrompts.value.filter((p) => p.status === 'draft'))

function formatDate(s: string) {
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toLocaleString()
}

function handleApprove(id: string) {
  // In a real app, this would call an API to update status
  // For now, we'll just update the local store if possible, or mock it
  console.log('Approve', id)
  const prompt = allPrompts.value.find((p) => p.id === id)
  if (prompt) {
    prompt.status = 'published'
  }
}

function handleReject(id: string) {
  console.log('Reject', id)
  const prompt = allPrompts.value.find((p) => p.id === id)
  if (prompt) {
    prompt.status = 'archived'
  }
}
</script>

<style scoped>
.review {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.review-header h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-gray-900);
}

.review-header p {
  color: var(--color-gray-500);
  margin-top: 0.5rem;
}

.pr-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.pr-card {
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.card-header h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.prompt-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  font-size: var(--text-xs);
  color: var(--color-primary);
  background-color: var(--color-surface-hover);
  padding: 0.25rem 0.5rem;
  border-radius: 100px;
}

.badge {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.25rem 0.55rem;
  border-radius: 9999px;
  background-color: var(--color-yellow-100);
  color: var(--color-yellow-700);
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: auto;
}

.card-meta {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  text-align: right;
}

.empty {
  text-align: center;
  color: var(--color-text-tertiary);
  padding: 2rem;
  font-style: italic;
}
</style>
