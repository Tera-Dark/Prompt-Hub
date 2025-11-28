<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import {
  fetchPendingSubmissions,
  approveSubmission,
  rejectSubmission,
  loadPrompts,
  type PendingSubmission,
  type Prompt,
} from '../../repositories/prompts'
import Button from '../../components/ui/Button.vue'
import Badge from '../../components/ui/Badge.vue'
import Modal from '../../components/ui/Modal.vue'
import * as Diff from 'diff'

const { t } = useI18n()
const auth = useAuth()
const pendingPrompts = ref<PendingSubmission[]>([])
const loading = ref(true)
const error = ref('')
const processingId = ref<string | null>(null)
const originalPrompts = ref<Record<string, Prompt>>({})
const selectedSubmission = ref<PendingSubmission | null>(null)

const fetchSubmissions = async () => {
  loading.value = true
  try {
    if (!auth.token.value) return
    pendingPrompts.value = await fetchPendingSubmissions(auth.token.value)

    // Fetch original prompts for updates/deletes
    try {
      const promptList = await loadPrompts()
      const promptMap = promptList.reduce(
        (acc, p) => {
          acc[p.id] = p
          return acc
        },
        {} as Record<string, Prompt>,
      )
      originalPrompts.value = promptMap
    } catch (loadError) {
      console.warn('Failed to load original prompts for diff view:', loadError)
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load submissions'
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openReview = (submission: PendingSubmission) => {
  selectedSubmission.value = submission
}

const closeReview = () => {
  selectedSubmission.value = null
}

const parsePromptFromIssueBody = (body: string): Partial<Prompt> => {
  const titleMatch = body.match(/\*\*Title:\*\* (.*)/)
  const categoryMatch = body.match(/\*\*Category:\*\* (.*)/)
  const descMatch = body.match(/\*\*Description:\*\*\s*\n([\s\S]*?)\n\n\*\*Prompt:\*\*/)
  const promptMatch = body.match(/```\n([\s\S]*?)\n```/)
  const tagsMatch = body.match(/\*\*Tags:\*\* (.*)/)

  return {
    title: titleMatch ? titleMatch[1].trim() : undefined,
    category: categoryMatch ? categoryMatch[1].trim() : undefined,
    description: descMatch ? descMatch[1].trim() : undefined,
    prompt: promptMatch ? promptMatch[1].trim() : undefined,
    tags: tagsMatch ? tagsMatch[1].split(',').map((s) => s.trim()) : undefined,
  }
}

const getDiff = (oldText: string, newText: string) => {
  const diff = Diff.diffWords(oldText || '', newText || '')
  return diff
}

const getFieldDiff = (submission: PendingSubmission, field: keyof Prompt) => {
  const original = submission.originalId ? originalPrompts.value[submission.originalId] : null
  const newValues = parsePromptFromIssueBody(submission.prompt)

  const oldVal = original ? String(original[field] || '') : ''
  const newVal = newValues[field] !== undefined ? String(newValues[field]) : oldVal

  return getDiff(oldVal, newVal)
}

const handleApprove = async () => {
  if (!auth.token.value || !selectedSubmission.value) return
  const submission = selectedSubmission.value
  processingId.value = submission.id
  try {
    await approveSubmission(submission, auth.token.value)
    pendingPrompts.value = pendingPrompts.value.filter((p) => p.id !== submission.id)
    closeReview()
  } catch (e) {
    console.error(e)
    alert('Failed to approve submission')
  } finally {
    processingId.value = null
  }
}

const handleReject = async () => {
  if (!auth.token.value || !selectedSubmission.value) return
  const submission = selectedSubmission.value
  processingId.value = submission.id
  try {
    await rejectSubmission(submission, auth.token.value)
    pendingPrompts.value = pendingPrompts.value.filter((p) => p.id !== submission.id)
    closeReview()
  } catch (e) {
    console.error(e)
    alert('Failed to reject submission')
  } finally {
    processingId.value = null
  }
}

const getAuthorName = (author: string | { username: string; avatarUrl?: string }) => {
  if (typeof author === 'string') return author
  return author?.username || 'Anonymous'
}

const getAuthorAvatar = (author: string | { username: string; avatarUrl?: string }) => {
  if (typeof author === 'object' && author?.avatarUrl) return author.avatarUrl
  return null
}

const getSubmissionTitle = (submission: PendingSubmission) => {
  if (submission.action === 'create') {
    const parsed = parsePromptFromIssueBody(submission.prompt)
    return parsed.title || t('review.types.create')
  }
  return submission.action === 'update'
    ? `${t('review.types.update')}: ${submission.originalId}`
    : `${t('review.types.delete')}: ${submission.originalId}`
}

onMounted(() => {
  fetchSubmissions()
})
</script>

<template>
  <section class="reviews">
    <header class="reviews-header">
      <div>
        <h2>{{ t('review.title') }}</h2>
        <p>{{ t('review.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <button class="refresh-button" @click="fetchSubmissions">
          {{ t('review.refresh') }}
        </button>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="spinner"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12 text-red-500">
      {{ error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="pendingPrompts.length === 0" class="empty">
      <h3>{{ t('review.empty') }}</h3>
    </div>

    <!-- List View -->
    <div v-else class="reviews-card">
      <header class="reviews-card__header">
        <span>{{ t('common.status.title') }}</span>
        <span>{{ t('review.fields.title') }}</span>
        <span>{{ t('review.submittedBy') }}</span>
        <span>{{ t('prompts.list.columns.actions') }}</span>
      </header>
      <ul class="reviews-list">
        <li v-for="submission in pendingPrompts" :key="submission.id" class="reviews-row">
          <div class="status-col">
            <div class="status-badge">
              <Badge :variant="submission.type === 'pr' ? 'info' : 'warning'" size="sm">
                {{ submission.type === 'pr' ? 'PR' : 'Issue' }}
              </Badge>
              <span
                class="status-text"
                :class="{
                  'status-create': submission.action === 'create',
                  'status-update': submission.action === 'update',
                  'status-delete': submission.action === 'delete',
                }"
              >
                {{
                  submission.action === 'create'
                    ? t('review.types.create')
                    : submission.action === 'update'
                      ? t('review.types.update')
                      : t('review.types.delete')
                }}
              </span>
            </div>
          </div>

          <div class="title-col">
            <h3>{{ getSubmissionTitle(submission) }}</h3>
          </div>

          <div class="author-col">
            <div class="author-info">
              <img
                v-if="getAuthorAvatar(submission.author)"
                :src="getAuthorAvatar(submission.author)"
                class="author-avatar"
                alt="Avatar"
              />
              <div v-else class="author-avatar-placeholder">
                {{ getAuthorName(submission.author).charAt(0).toUpperCase() }}
              </div>
              <span class="author-name">{{ getAuthorName(submission.author) }}</span>
            </div>
          </div>

          <div class="actions-col">
            <Button size="sm" @click="openReview(submission)">
              {{ t('common.actions.view') }}
            </Button>
          </div>
        </li>
      </ul>
    </div>

    <!-- Review Modal -->
    <Modal
      :is-open="!!selectedSubmission"
      :title="selectedSubmission ? getSubmissionTitle(selectedSubmission) : ''"
      size="xl"
      @close="closeReview"
    >
      <template v-if="selectedSubmission">
        <div class="review-detail">
          <!-- Meta Info -->
          <div class="meta-card">
            <div class="meta-author">
              <img
                v-if="getAuthorAvatar(selectedSubmission.author)"
                :src="getAuthorAvatar(selectedSubmission.author)"
                class="meta-avatar"
              />
              <div v-else class="meta-avatar-placeholder">
                {{ getAuthorName(selectedSubmission.author).charAt(0).toUpperCase() }}
              </div>
              <div>
                <div class="meta-name">{{ getAuthorName(selectedSubmission.author) }}</div>
                <div class="meta-date">
                  {{ new Date(selectedSubmission.createdAt).toLocaleString() }}
                </div>
              </div>
            </div>
            <div class="meta-divider"></div>
            <div>
              <div class="meta-label">Source</div>
              <a :href="selectedSubmission.sourceLink" target="_blank" class="meta-link">
                {{ selectedSubmission.type === 'pr' ? 'Pull Request' : 'Issue' }} #{{
                  selectedSubmission.number
                }}
              </a>
            </div>
          </div>

          <!-- Content -->

          <!-- Create Mode -->
          <div v-if="selectedSubmission.action === 'create'">
            <div class="content-box">
              <pre class="code-block">{{ selectedSubmission.prompt }}</pre>
            </div>
          </div>

          <!-- Update Mode -->
          <div v-else-if="selectedSubmission.action === 'update'" class="diff-container">
            <div
              v-for="field in ['title', 'description', 'prompt', 'category', 'tags']"
              :key="field"
              class="diff-field"
            >
              <div class="diff-label">{{ t(`review.fields.${field}`) }}</div>
              <div class="diff-content">
                <span
                  v-for="(part, index) in getFieldDiff(selectedSubmission, field as keyof Prompt)"
                  :key="index"
                  :class="{
                    'diff-added': part.added,
                    'diff-removed': part.removed,
                    'diff-normal': !part.added && !part.removed,
                  }"
                  >{{ part.value }}</span
                >
              </div>
            </div>
          </div>

          <!-- Delete Mode -->
          <div v-else-if="selectedSubmission.action === 'delete'">
            <div class="delete-warning">
              {{ t('review.types.delete') }}: {{ selectedSubmission.originalId }}
            </div>

            <div v-if="originalPrompts[selectedSubmission.originalId!]" class="delete-preview">
              <h4 class="preview-title">
                {{ originalPrompts[selectedSubmission.originalId!].title }}
              </h4>
              <p class="preview-desc">
                {{ originalPrompts[selectedSubmission.originalId!].description }}
              </p>
              <div class="preview-code">
                {{ originalPrompts[selectedSubmission.originalId!].prompt }}
              </div>
            </div>
            <div v-else class="delete-empty">
              {{ t('common.messages.originalNotFound') }}
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <Button variant="ghost" @click="closeReview"> Cancel </Button>
        <Button variant="danger" :disabled="!!processingId" @click="handleReject">
          {{ processingId === selectedSubmission?.id ? t('review.rejecting') : t('review.reject') }}
        </Button>
        <Button variant="success" :disabled="!!processingId" @click="handleApprove">
          {{
            processingId === selectedSubmission?.id ? t('review.approving') : t('review.approve')
          }}
        </Button>
      </template>
    </Modal>
  </section>
</template>

<style scoped>
.reviews {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.reviews-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.reviews-header h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-gray-900);
}

.reviews-header p {
  color: var(--color-gray-500);
  margin-top: 0.5rem;
}

.refresh-button {
  padding: 0.65rem 1.1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-300);
  background-color: var(--color-white);
  color: var(--color-gray-700);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

.refresh-button:hover {
  border-color: var(--color-gray-400);
  background-color: var(--color-gray-50);
}

.reviews-card {
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.reviews-card__header {
  display: grid;
  grid-template-columns: 180px minmax(0, 2fr) 200px 120px;
  padding: 1rem 1.5rem;
  font-size: var(--text-sm);
  font-weight: 600;
  background-color: var(--color-gray-50);
  color: var(--color-gray-600);
}

.reviews-list {
  display: flex;
  flex-direction: column;
}

.reviews-row {
  display: grid;
  grid-template-columns: 180px minmax(0, 2fr) 200px 120px;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--color-gray-100);
}

.reviews-row:first-of-type {
  border-top: none;
}

/* Status Column */
.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-text {
  font-size: var(--text-xs);
  font-weight: 500;
}

.status-create {
  color: var(--color-success);
}
.status-update {
  color: var(--color-info);
}
.status-delete {
  color: var(--color-danger);
}

/* Title Column */
.title-col h3 {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-gray-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Author Column */
.author-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author-avatar,
.author-avatar-placeholder {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-gray-200);
}

.author-avatar-placeholder {
  background-color: var(--color-gray-200);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--color-gray-600);
}

.author-name {
  font-size: var(--text-sm);
  color: var(--color-gray-700);
}

/* Actions Column */
.actions-col {
  display: flex;
  justify-content: flex-end;
}

/* Detail View Styles */
.review-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.meta-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--color-gray-50);
  border: 1px solid var(--color-gray-100);
  border-radius: var(--radius-md);
}

.meta-author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.meta-avatar,
.meta-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.meta-avatar-placeholder {
  background-color: var(--color-gray-200);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.meta-name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-gray-900);
}

.meta-date {
  font-size: var(--text-xs);
  color: var(--color-gray-500);
}

.meta-divider {
  height: 24px;
  width: 1px;
  background-color: var(--color-gray-300);
}

.meta-label {
  font-size: 10px;
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meta-link {
  font-size: var(--text-sm);
  color: var(--color-primary);
  text-decoration: none;
}

.meta-link:hover {
  text-decoration: underline;
}

/* Code Blocks */
.content-box {
  background-color: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  padding: 1rem;
  overflow-x: auto;
}

.code-block {
  font-family: monospace;
  font-size: var(--text-sm);
  white-space: pre-wrap;
  color: var(--color-gray-800);
}

/* Diff Styles */
.diff-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.diff-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.diff-label {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  color: var(--color-gray-500);
}

.diff-content {
  background-color: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  font-family: monospace;
  font-size: var(--text-sm);
  line-height: 1.6;
}

.diff-added {
  background-color: #dcfce7;
  color: #166534;
  padding: 0 2px;
  border-radius: 2px;
}

.diff-removed {
  background-color: #fee2e2;
  color: #991b1b;
  text-decoration: line-through;
  padding: 0 2px;
  border-radius: 2px;
  margin-right: 2px;
}

.diff-normal {
  color: var(--color-gray-700);
}

/* Delete Preview */
.delete-warning {
  padding: 0.75rem;
  background-color: var(--color-danger-light);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  color: var(--color-danger-dark);
  font-weight: 500;
  font-size: var(--text-sm);
  margin-bottom: 1rem;
}

.delete-preview {
  opacity: 0.75;
  filter: grayscale(100%);
  transition: all 0.3s ease;
}

.delete-preview:hover {
  filter: grayscale(0%);
  opacity: 1;
}

.preview-title {
  font-size: var(--text-lg);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.preview-desc {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
  margin-bottom: 1rem;
}

.preview-code {
  background-color: var(--color-gray-100);
  padding: 0.75rem;
  border-radius: var(--radius-md);
  font-family: monospace;
  font-size: var(--text-sm);
}

.delete-empty {
  padding: 2rem;
  text-align: center;
  border: 2px dashed var(--color-gray-300);
  border-radius: var(--radius-lg);
  color: var(--color-gray-500);
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty {
  text-align: center;
  padding: 3rem;
  color: var(--color-gray-500);
  background-color: var(--color-gray-50);
  border-radius: var(--radius-lg);
}
</style>
