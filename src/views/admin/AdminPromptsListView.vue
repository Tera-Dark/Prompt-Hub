<template>
  <section class="prompts">
    <header class="prompts-header">
      <div>
        <h2>{{ t('prompts.list.title') }}</h2>
        <p>{{ t('prompts.list.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('common.search')"
            class="search-input"
          />
        </div>
        <button class="drafts-button" @click="showDrafts = true">
          {{ t('prompts.list.actions.drafts') }}
        </button>
        <RouterLink to="/admin/prompts/new" class="new-button">
          {{ t('prompts.new') }}
        </RouterLink>
      </div>
    </header>

    <div v-if="filteredItems.length" class="prompts-card">
      <header class="prompts-card__header">
        <span>{{ t('prompts.list.columns.title') }}</span>
        <span>{{ t('prompts.list.columns.category') }}</span>
        <span>{{ t('prompts.list.columns.updated') }}</span>
        <span>{{ t('prompts.list.columns.actions') }}</span>
      </header>
      <ul class="prompts-list">
        <li v-for="p in filteredItems" :key="p.id" class="prompts-row">
          <div class="prompt-info">
            <h3>{{ p.title }}</h3>
            <p>{{ p.description }}</p>
          </div>
          <span class="prompt-status">{{ p.category }}</span>
          <RouterLink :to="`/admin/prompts/${p.id}/edit`" class="prompt-edit">{{
            formatUpdated(p)
          }}</RouterLink>
          <div class="row-actions">
            <RouterLink :to="`/admin/prompts/${p.id}/edit`" class="action">
              {{ t('prompts.list.actions.edit') }}
            </RouterLink>
            <button class="action danger" :disabled="submitting" @click="onDelete(p.id)">
              {{ t('prompts.list.actions.delete') }}
            </button>
          </div>
        </li>
      </ul>
    </div>

    <div v-else class="empty">
      <h3>{{ t('prompts.list.empty.title') }}</h3>
      <p>{{ t('prompts.list.empty.desc') }}</p>
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
import { RouterLink, useRouter } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import { type Prompt } from '@/types/prompt'
import { deletePromptById, loadPrompts } from '@/repositories/prompts'
import { useLocalDrafts } from '@/composables/useLocalDrafts'

const { t } = useI18n()
const router = useRouter()
const items = ref<Prompt[]>([])
const submitting = ref(false)
const showDrafts = ref(false)
const searchQuery = ref('')
const { token, hasRepoWriteAccess } = useAuth()
const { drafts, loadDrafts, deleteDraft } = useLocalDrafts()

// repo info handled in repository layer

onMounted(async () => {
  try {
    const data = await loadPrompts()
    items.value = data.prompts
    loadDrafts()
  } catch {
    // Silently fail if prompts data cannot be loaded
  }
})

const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value
  const q = searchQuery.value.toLowerCase()
  return items.value.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q),
  )
})

function formatUpdated(p: Prompt) {
  const s = p.updatedAt || p.createdAt
  const d = new Date(s)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

function ensureAuth() {
  if (!token.value || !hasRepoWriteAccess.value) throw new Error(t('auth.writeAccessRequired'))
}

async function onDelete(id: string) {
  ensureAuth()
  if (!confirm(`Confirm delete?\nID: ${id}`)) return
  submitting.value = true
  try {
    const tVal = token.value!
    const url = await deletePromptById(id, tVal, hasRepoWriteAccess.value)
    if (hasRepoWriteAccess.value) {
      alert('Deleted successfully')
    } else {
      alert(`Pull Request created:\n${url}`)
    }
    items.value = items.value.filter((x) => x.id !== id)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Delete failed'
    alert(msg)
  } finally {
    submitting.value = false
  }
}

function continueDraft(id: string) {
  router.push({ path: '/admin/prompts/new', query: { draftId: id } })
}

function removeDraft(id: string) {
  if (confirm('Delete this draft?')) {
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
  align-items: center;
}

.search-box {
  margin-right: 0.5rem;
}

.search-input {
  padding: 0.65rem 1.1rem;
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  min-width: 250px;
}

.new-button {
  padding: 0.65rem 1.1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-900);
  background-color: var(--color-black);
  color: var(--color-white);
  font-size: var(--text-sm);
  transition: background-color var(--transition-base);
}

.new-button:hover,
.new-button:focus-visible {
  background-color: var(--color-gray-900);
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

.prompt-status {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
}

.prompt-edit {
  font-size: var(--text-sm);
  color: var(--color-gray-900);
  justify-self: flex-start;
  border-bottom: 1px solid transparent;
  padding-bottom: 0.1rem;
}

.row-actions {
  display: flex;
  align-items: center;
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

.danger {
  background-color: var(--color-white);
  color: var(--color-red-600, #dc2626);
  border-color: var(--color-red-600, #dc2626);
}

.prompt-edit:hover,
.prompt-edit:focus-visible {
  border-color: var(--color-gray-800);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--color-white);
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
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-gray-500);
}

.drafts-list {
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.draft-item {
  padding: 1rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.draft-info h4 {
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.draft-meta {
  font-size: var(--text-xs);
  color: var(--color-gray-500);
}

.draft-actions {
  display: flex;
  gap: 0.5rem;
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

  .prompt-status,
  .prompt-edit {
    justify-self: flex-start;
  }
}
</style>
