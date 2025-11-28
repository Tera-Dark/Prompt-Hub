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
            <div class="badges">
              <span class="badge" :data-type="prompt.type">{{
                prompt.type === 'pr' ? 'Pull Request' : 'Issue'
              }}</span>
              <span class="badge" data-state="pending">{{ t('review.status.pending') }}</span>
            </div>
          </div>
          <div class="card-content">
            <p class="prompt-text">{{ prompt.description }}</p>
            <div class="tags">
              <span v-for="tag in prompt.tags" :key="tag" class="tag">#{{ tag }}</span>
            </div>
            <a
              v-if="prompt.sourceLink"
              :href="prompt.sourceLink"
              target="_blank"
              class="source-link"
            >
              View on GitHub ↗
            </a>
          </div>
          <div class="card-actions">
            <Button
              variant="outline"
              size="sm"
              :disabled="!!processingId"
              @click="handleReject(prompt)"
            >
              {{ processingId === prompt.id ? 'Processing...' : t('review.reject') }}
            </Button>
            <Button
              variant="primary"
              size="sm"
              :disabled="!!processingId"
              @click="handleApprove(prompt)"
            >
              {{ processingId === prompt.id ? 'Processing...' : t('review.approve') }}
            </Button>
          </div>
          <div class="card-meta">
            <span v-if="prompt.author" class="author">by {{ prompt.author.username }} • </span>
            <span class="date">{{ formatDate(prompt.createdAt) }}</span>
          </div>
        </article>
        <div v-if="!pendingPrompts.length" class="empty">{{ t('review.empty') }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import {
  getPendingSubmissions,
  approveSubmission,
  rejectSubmission,
  type PendingSubmission,
} from '@/repositories/prompts'
import Button from '@/components/ui/Button.vue'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const { token, hasRepoWriteAccess } = useAuth()
const toast = useToast()

const pendingPrompts = ref<PendingSubmission[]>([])
const loading = ref(false)
const processingId = ref<string | null>(null)

async function fetchSubmissions() {
  if (!token.value) return
  loading.value = true
  try {
    pendingPrompts.value = await getPendingSubmissions(token.value)
  } catch (e) {
    console.error(e)
    toast.error('Failed to load submissions')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSubmissions()
})

function formatDate(s: string) {
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toLocaleString()
}

async function handleApprove(submission: PendingSubmission) {
  if (!hasRepoWriteAccess.value) {
    toast.error(t('auth.writeAccessRequired'))
    return
  }

  processingId.value = submission.id
  try {
    await approveSubmission(submission, token.value!)
    toast.success('Submission approved and merged')
    // Remove from list immediately for UX
    pendingPrompts.value = pendingPrompts.value.filter((p) => p.id !== submission.id)
    // Reload to ensure sync with GitHub
    setTimeout(() => fetchSubmissions(), 1000)
  } catch (e) {
    console.error(e)
    toast.error(e instanceof Error ? e.message : 'Failed to approve')
  } finally {
    processingId.value = null
  }
}

async function handleReject(submission: PendingSubmission) {
  if (!hasRepoWriteAccess.value) {
    toast.error(t('auth.writeAccessRequired'))
    return
  }

  if (!confirm('Are you sure you want to reject (close) this submission?')) return

  processingId.value = submission.id
  try {
    await rejectSubmission(submission, token.value!)
    toast.success('Submission rejected and closed')
    // Remove from list immediately for UX
    pendingPrompts.value = pendingPrompts.value.filter((p) => p.id !== submission.id)
    // Reload to ensure sync with GitHub
    setTimeout(() => fetchSubmissions(), 1000)
  } catch (e) {
    console.error(e)
    toast.error(e instanceof Error ? e.message : 'Failed to reject')
  } finally {
    processingId.value = null
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

.badges {
  display: flex;
  gap: 0.5rem;
}

.badge {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.25rem 0.55rem;
  border-radius: 9999px;
  font-weight: 600;
}

.badge[data-state='pending'] {
  background-color: var(--color-yellow-100);
  color: var(--color-yellow-700);
}

.badge[data-type='pr'] {
  background-color: var(--color-blue-100);
  color: var(--color-blue-700);
}

.badge[data-type='issue'] {
  background-color: var(--color-green-100);
  color: var(--color-green-700);
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

.source-link {
  font-size: var(--text-xs);
  color: var(--color-primary);
  text-decoration: none;
}

.source-link:hover {
  text-decoration: underline;
}

.empty {
  text-align: center;
  color: var(--color-text-tertiary);
  padding: 2rem;
  font-style: italic;
}
</style>
