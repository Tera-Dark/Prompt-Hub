<template>
  <section class="prompts">
    <header class="prompts-header">
      <div>
        <h2>{{ t('dashboard.mySubmissions') }}</h2>
        <p>{{ t('dashboard.trackSubmissions') }}</p>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('home.searchPlaceholder')"
            class="search-input"
          />
        </div>
        <button class="drafts-button" @click="showDrafts = true">
          {{ t('prompts.list.actions.drafts') }}
        </button>
        <Button variant="primary" @click="$router.push('/prompts/new')">
          {{ t('prompts.new') }}
        </Button>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>{{ t('common.status.loading') }}</span>
    </div>

    <div v-else-if="userPrompts.length > 0" class="prompts-card">
      <header class="prompts-card__header">
        <span>{{ t('prompts.list.columns.title') }}</span>
        <span>{{ t('prompts.list.columns.category') }}</span>
        <span>{{ t('common.status.title') }}</span>
        <span>{{ t('prompts.list.columns.actions') }}</span>
      </header>
      <ul class="prompts-list">
        <li v-for="p in userPrompts" :key="p.id" class="prompts-row">
          <div class="prompt-info">
            <h3>{{ p.title }}</h3>
            <p>{{ p.description }}</p>
          </div>
          <span class="prompt-category">{{ p.category }}</span>

          <div class="prompt-status">
            <span class="status-badge" :class="p.status || 'published'">
              {{ getStatusLabel(p.status) }}
            </span>
          </div>

          <div class="row-actions">
            <Button
              v-if="p.status === 'published'"
              variant="outline"
              size="sm"
              @click="$router.push(`/prompt/${p.id}`)"
            >
              {{ t('common.actions.view') }}
            </Button>
            <Button
              v-if="p.status === 'published'"
              variant="outline"
              size="sm"
              @click="$router.push({ name: 'UserPromptEdit', params: { id: p.id } })"
            >
              {{ t('common.actions.edit') }}
            </Button>
            <Button
              v-if="p.status === 'published'"
              variant="danger"
              size="sm"
              :disabled="deleting === p.id"
              @click="handleDelete(p)"
            >
              {{ t('common.actions.delete') }}
            </Button>
            <template v-else-if="p.sourceLink">
              <Button variant="outline" size="sm" @click="openSourceLink(p.sourceLink)">
                {{ t('common.actions.track') }} ↗
              </Button>
              <Button
                v-if="p.status === 'draft' && p.id.startsWith('issue-')"
                variant="danger"
                size="sm"
                :disabled="withdrawing === p.id"
                @click="handleWithdraw(p.id)"
              >
                {{ t('common.actions.withdraw') }}
              </Button>
            </template>
          </div>
        </li>
      </ul>
    </div>

    <div v-else class="empty">
      <h3>{{ t('dashboard.noSubmissions') }}</h3>
      <p>{{ t('dashboard.startContributing') }}</p>
      <Button variant="primary" class="mt-4" @click="$router.push('/prompts/new')">
        {{ t('prompts.createFirst') }}
      </Button>
    </div>

    <!-- Drafts Modal -->
    <div v-if="showDrafts" class="modal-overlay" @click="showDrafts = false">
      <div class="modal-content" @click.stop>
        <header class="modal-header">
          <h3>{{ t('prompts.drafts.title') }}</h3>
          <button class="close-btn" @click="showDrafts = false">×</button>
        </header>

        <div v-if="drafts.length" class="drafts-list">
          <div v-for="draft in drafts" :key="draft.id" class="draft-item">
            <div class="draft-info">
              <h4>{{ draft.title || 'Untitled' }}</h4>
              <span class="draft-meta">
                {{ t('prompts.drafts.lastSaved') }}: {{ new Date(draft.savedAt).toLocaleString() }}
              </span>
            </div>
            <div class="draft-actions">
              <button class="action primary" @click="continueDraft(draft.id)">
                {{ t('prompts.drafts.actions.continue') }}
              </button>
              <button class="action danger" @click="removeDraft(draft.id)">
                {{ t('prompts.drafts.actions.delete') }}
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-drafts">
          <p>{{ t('prompts.drafts.empty') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePromptStore } from '@/stores/prompts'
import { useAuth } from '@/composables/useAuth'
import Button from '@/components/ui/Button.vue'
import {
  getUserSubmissions,
  withdrawSubmission,
  deletePromptById,
  submitPromptDelete,
  type PendingSubmission,
} from '@/repositories/prompts'
import { useLocalDrafts } from '@/composables/useLocalDrafts'
import type { Prompt } from '@/types/prompt'

const { t } = useI18n()
const router = useRouter()
const promptStore = usePromptStore()
const { user, token, hasRepoWriteAccess } = useAuth()
const { drafts, loadDrafts, deleteDraft } = useLocalDrafts()
const { prompts: allPrompts, isLoading: loadingPrompts } = promptStore

const pendingSubmissions = ref<PendingSubmission[]>([])
const loadingSubmissions = ref(false)
const showDrafts = ref(false)
const withdrawing = ref<string | null>(null)
const searchQuery = ref('')
const deleting = ref<string | null>(null)

onMounted(async () => {
  promptStore.fetchPrompts()
  loadDrafts()
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

  // Filter out published prompts that have a pending delete request
  const pendingDeleteIds = pendingSubmissions.value
    .filter((s) => s.action === 'delete' && s.originalId)
    .map((s) => s.originalId)

  const published = allPrompts.value.filter(
    (p) => p.author?.username === user.value?.login && !pendingDeleteIds.includes(p.id),
  )
  const all: Prompt[] = [...pendingSubmissions.value, ...published]

  if (!searchQuery.value) return all
  const q = searchQuery.value.toLowerCase()
  return all.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q),
  )
})

function getStatusLabel(status?: string) {
  if (!status || status === 'published') return t('common.status.published')
  if (status === 'draft') return t('common.status.draft')
  if (status === 'archived') return t('common.status.archived')
  return status
}

function openSourceLink(url: string) {
  window.open(url, '_blank')
}

async function handleDelete(prompt: Prompt) {
  if (!confirm(t('common.messages.deleteConfirm'))) return

  deleting.value = prompt.id
  try {
    if (hasRepoWriteAccess.value) {
      await deletePromptById(prompt.id, token.value!, true)
      alert(t('common.messages.deleteSuccess'))
    } else {
      const url = await submitPromptDelete(prompt.id, token.value!)
      alert(t('common.messages.issueCreated', { url }))
    }
  } catch (e) {
    console.error(e)
    alert(t('common.messages.deleteFailed'))
  } finally {
    deleting.value = null
  }
}

async function handleWithdraw(id: string) {
  if (!confirm(t('common.actions.confirmWithdraw'))) return

  // Extract issue number from ID "issue-123"
  const issueNumber = parseInt(id.replace('issue-', ''))
  if (isNaN(issueNumber) || !token.value) return

  withdrawing.value = id
  try {
    await withdrawSubmission(issueNumber, token.value)
    // Remove from local list
    pendingSubmissions.value = pendingSubmissions.value.filter((p) => p.id !== id)
  } catch (e) {
    console.error('Failed to withdraw submission', e)
    alert(t('common.messages.withdrawFailed'))
  } finally {
    withdrawing.value = null
  }
}

function continueDraft(id: string) {
  router.push({ path: '/prompts/new', query: { draftId: id } })
}

function removeDraft(id: string) {
  if (confirm(t('common.actions.confirmDeleteDraft'))) {
    deleteDraft(id)
  }
}
</script>

<style scoped>
.prompts {
  max-width: 1200px;
  margin: 0 auto;
}

.prompts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-box {
  margin-right: 0.5rem;
}

.search-input {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  min-width: 250px;
}

.drafts-button {
  color: var(--color-gray-600);
  font-size: 0.875rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.drafts-button:hover {
  color: var(--color-primary-600);
  text-decoration: underline;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: var(--color-gray-500);
  gap: 1rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary-600);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.prompts-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.prompts-card__header {
  display: grid;
  grid-template-columns: minmax(0, 2fr) 1fr 1fr 1.5fr;
  padding: 1rem 1.5rem;
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-100);
  font-weight: 500;
  color: var(--color-gray-600);
  font-size: 0.875rem;
}

.prompts-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.prompts-row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) 1fr 1fr 1.5fr;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-gray-100);
  align-items: center;
  transition: background-color 0.2s;
}

.prompts-row:last-child {
  border-bottom: none;
}

.prompts-row:hover {
  background-color: var(--color-gray-50);
}

.prompt-info h3 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-gray-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prompt-info p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-gray-500);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prompt-category {
  color: var(--color-gray-600);
  font-size: 0.875rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.published {
  background: var(--color-green-50);
  color: var(--color-green-700);
}

.status-badge.draft {
  background: var(--color-yellow-50);
  color: var(--color-yellow-700);
}

.status-badge.archived {
  background: var(--color-gray-100);
  color: var(--color-gray-600);
}

.row-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-start;
}

.empty {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.empty h3 {
  margin: 0 0 0.5rem;
  color: var(--color-gray-900);
}

.empty p {
  color: var(--color-gray-500);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background: white;
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-gray-100);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-gray-400);
}

.drafts-list {
  padding: 1rem;
  overflow-y: auto;
}

.draft-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-gray-100);
}

.draft-item:last-child {
  border-bottom: none;
}

.draft-meta {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.draft-actions {
  display: flex;
  gap: 0.5rem;
}

.action {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  cursor: pointer;
  border: 1px solid transparent;
}

.action.primary {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
}

.action.danger {
  background: var(--color-red-50);
  color: var(--color-red-700);
}

.empty-drafts {
  padding: 3rem;
  text-align: center;
  color: var(--color-gray-500);
}
</style>
