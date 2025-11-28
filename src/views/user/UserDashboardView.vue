<template>
  <section class="prompts">
    <header class="prompts-header">
      <div>
        <h2>{{ t('dashboard.mySubmissions') }}</h2>
        <p>{{ t('dashboard.trackSubmissions') }}</p>
      </div>
      <div class="header-actions">
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
import { getUserSubmissions, withdrawSubmission } from '@/repositories/prompts'
import { useLocalDrafts } from '@/composables/useLocalDrafts'
import type { Prompt } from '@/types/prompt'

const { t } = useI18n()
const router = useRouter()
const promptStore = usePromptStore()
const { user, token } = useAuth()
const { drafts, loadDrafts, deleteDraft } = useLocalDrafts()
const { prompts: allPrompts, isLoading: loadingPrompts } = promptStore

const pendingSubmissions = ref<Prompt[]>([])
const loadingSubmissions = ref(false)
const showDrafts = ref(false)
const withdrawing = ref<string | null>(null)

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
  const published = allPrompts.value.filter((p) => p.author?.username === user.value?.login)
  return [...pendingSubmissions.value, ...published]
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
    alert('Failed to withdraw submission')
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
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.prompts-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.prompts-header h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-gray-900);
}

.prompts-header p {
  color: var(--color-gray-500);
  margin-top: 0.5rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.drafts-button {
  padding: 0.65rem 1.1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-300);
  background-color: var(--color-white);
  color: var(--color-gray-700);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

.drafts-button:hover {
  border-color: var(--color-gray-400);
  background-color: var(--color-gray-50);
}

.prompts-card {
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.prompts-card__header {
  display: grid;
  grid-template-columns: 2fr 160px 160px 220px;
  padding: 1rem 1.5rem;
  font-size: var(--text-sm);
  font-weight: 600;
  background-color: var(--color-gray-50);
  color: var(--color-gray-600);
}

.prompts-list {
  display: flex;
  flex-direction: column;
}

.prompts-row {
  display: grid;
  grid-template-columns: 2fr 160px 160px 220px;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--color-gray-100);
}

.prompts-row:first-of-type {
  border-top: none;
}

.prompt-info h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-gray-900);
}

.prompt-info p {
  font-size: var(--text-sm);
  color: var(--color-gray-500);
  margin-top: 0.25rem;
}

.prompt-category {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
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

.row-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.empty {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--color-border);
}

.empty h3 {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.empty p {
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}

.mt-4 {
  margin-top: 1rem;
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-gray-900);
}

.close-btn {
  font-size: 1.5rem;
  color: var(--color-gray-500);
  background: none;
  border: none;
  cursor: pointer;
  line-height: 1;
}

.drafts-list {
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.draft-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  background: var(--color-gray-50);
}

.draft-info h4 {
  font-weight: 500;
  color: var(--color-gray-900);
}

.draft-meta {
  font-size: var(--text-xs);
  color: var(--color-gray-500);
}

.draft-actions {
  display: flex;
  gap: 0.5rem;
}

.action {
  padding: 0.45rem 0.9rem;
  border: 1px solid var(--color-gray-900);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  cursor: pointer;
}

.action.primary {
  background-color: var(--color-black);
  color: var(--color-white);
}

.action.danger {
  border-color: var(--color-red-600);
  color: var(--color-red-600);
  background: transparent;
}

.action.danger:hover {
  background: var(--color-red-50);
}

.empty-drafts {
  padding: 3rem;
  text-align: center;
  color: var(--color-gray-500);
}

@media (max-width: 960px) {
  .prompts-card__header,
  .prompts-row {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .prompts-card__header {
    display: none;
  }

  .prompts-row {
    gap: 0.75rem;
  }
}
</style>
