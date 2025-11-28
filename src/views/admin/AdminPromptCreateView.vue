<template>
  <section class="prompt-editor">
    <header class="editor-header">
      <div>
        <h2>{{ t('prompts.create.title') }}</h2>
        <p>
          {{ t('prompts.create.subtitle') }}
        </p>
      </div>
      <div class="header-actions">
        <RouterLink to="/admin/prompts" class="back-link">
          {{ t('prompts.create.actions.back') }}
        </RouterLink>
      </div>
    </header>

    <div v-if="error" class="error-message" style="color: red; padding: 1rem">
      Error loading prompts: {{ error }}
    </div>
    <div v-if="loading" class="loading-message" style="padding: 1rem">Loading data...</div>

    <form class="editor-form" @submit.prevent="onSubmit">
      <div class="form-layout">
        <!-- Left Column: Metadata -->
        <aside class="form-sidebar">
          <div class="form-group">
            <label class="form-label">{{ t('prompts.create.form.title') }}</label>
            <input
              v-model="form.title"
              type="text"
              :placeholder="t('prompts.create.form.titlePlaceholder')"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('prompts.create.form.category') }}</label>
            <div class="category-input-group">
              <input
                v-model="form.category"
                list="category-list"
                type="text"
                :placeholder="t('prompts.create.form.selectCategory')"
                class="form-input"
              />
              <datalist id="category-list">
                <option v-for="c in categories" :key="c" :value="c" />
              </datalist>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('prompts.create.form.status') }}</label>
            <select v-model="form.status" class="form-select">
              <option value="draft">{{ t('prompts.create.form.statusOptions.draft') }}</option>
              <option value="published">
                {{ t('prompts.create.form.statusOptions.published') }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('prompts.create.form.tags') }}</label>
            <input
              v-model="tagsInput"
              type="text"
              :placeholder="t('prompts.create.form.tagsPlaceholder')"
              class="form-input"
            />
          </div>
        </aside>

        <!-- Right Column: Content -->
        <div class="form-main">
          <div class="form-group">
            <label class="form-label">{{ t('prompts.create.form.description') }}</label>
            <textarea
              v-model="form.description"
              rows="3"
              :placeholder="t('prompts.create.form.descriptionPlaceholder')"
              class="form-textarea"
            ></textarea>
          </div>

          <div class="form-group form-group--flex">
            <label class="form-label">{{ t('prompts.create.form.body') }}</label>
            <textarea
              v-model="form.prompt"
              rows="15"
              :placeholder="t('prompts.create.form.bodyPlaceholder')"
              class="form-textarea prompt-body"
            ></textarea>
          </div>
        </div>
      </div>

      <div class="form-footer">
        <button type="button" class="btn btn-secondary" :disabled="submitting" @click="saveDraft">
          {{ t('prompts.create.actions.saveDraft') }}
        </button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          {{ t('prompts.create.actions.publish') }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { usePrompts } from '@/composables/usePrompts'
import { useAuth } from '@/composables/useAuth'
import { type Prompt } from '@/types/prompt'
import { addPrompt } from '@/repositories/prompts'
import { useToast } from '@/composables/useToast'
import { useLocalDrafts } from '@/composables/useLocalDrafts'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { categories, fetchPrompts, loading, error } = usePrompts()
const { token, hasRepoWriteAccess, user } = useAuth()
const toast = useToast()
const { saveDraft: saveLocalDraft, getDraft, deleteDraft } = useLocalDrafts()

// Ensure categories are loaded
fetchPrompts()

const form = ref({
  title: '',
  category: '',
  description: '',
  prompt: '',
  status: 'draft' as 'draft' | 'published' | 'archived',
  imageUrl: '',
})
const tagsInput = ref('')
const submitting = ref(false)
const currentDraftId = ref<string | null>(null)

onMounted(() => {
  const draftId = route.query.draftId as string
  if (draftId) {
    const draft = getDraft(draftId)
    if (draft) {
      currentDraftId.value = draftId
      form.value = {
        title: draft.title,
        category: draft.category,
        description: draft.description,
        prompt: draft.prompt,
        status: draft.status as any,
        imageUrl: draft.imageUrl,
      }
      tagsInput.value = draft.tags
      toast.info('Draft loaded')
    }
  }
})

function ensureAuth() {
  if (!token.value) throw new Error(t('auth.signIn'))
}

function genId(title: string, category: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const ts = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 12)
  return `${category}-${slug}-${ts}`
}

function validate(): string | null {
  if (!form.value.title.trim()) return 'Title is required'
  if (!form.value.category.trim()) return 'Category is required'
  if (!form.value.description.trim()) return 'Description is required'
  if (!form.value.prompt.trim()) return 'Prompt body is required'
  return null
}

async function saveDraft() {
  const id = saveLocalDraft({
    id: currentDraftId.value || undefined,
    title: form.value.title,
    category: form.value.category,
    description: form.value.description,
    prompt: form.value.prompt,
    tags: tagsInput.value,
    status: form.value.status,
    imageUrl: form.value.imageUrl,
  })

  if (id) {
    currentDraftId.value = id
    // Update URL without reload
    router.replace({ query: { ...route.query, draftId: id } })
  }
}

function onSubmit(_e: SubmitEvent) {
  handleSubmit()
}

async function handleSubmit(_draft = false) {
  ensureAuth()

  if (_draft) {
    form.value.status = 'draft'
  }

  const err = validate()
  if (err) {
    toast.error(err)
    return
  }
  submitting.value = true
  try {
    const authToken = token.value!
    const tags = tagsInput.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const now = new Date().toISOString()
    const newItem: Prompt = {
      id: genId(form.value.title, form.value.category),
      title: form.value.title.trim(),
      category: form.value.category.trim(),
      description: form.value.description.trim(),
      prompt: form.value.prompt.trim(),
      tags,
      createdAt: now,
      status: form.value.status,
      imageUrl: form.value.imageUrl,
      author: user.value
        ? {
            username: user.value.login,
            avatarUrl: user.value.avatar_url || undefined,
          }
        : undefined,
    }
    const url = await addPrompt(newItem, authToken, hasRepoWriteAccess.value)

    if (hasRepoWriteAccess.value) {
      toast.success(t('prompts.create.actions.directCommitSuccess') || 'Published successfully')
    } else {
      toast.success(t('prompts.create.actions.prCreated') || 'PR Created')
      console.log('PR URL:', url)
    }

    // Clear form and draft
    if (currentDraftId.value) {
      deleteDraft(currentDraftId.value)
      currentDraftId.value = null
    }

    form.value = {
      title: '',
      category: '',
      description: '',
      prompt: '',
      status: 'draft',
      imageUrl: '',
    }
    tagsInput.value = ''
    router.push('/admin/prompts')
  } catch (e) {
    console.error('Submission error:', e)
    let msg = e instanceof Error ? e.message : 'Submission failed'

    if (msg.includes('Bad credentials') || msg.includes('401')) {
      msg = 'Authentication expired or invalid. Please sign out and sign in again.'
    }

    toast.error(msg)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.prompt-editor {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.editor-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.editor-header h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-gray-900);
}

.editor-header p {
  color: var(--color-gray-500);
  margin-top: 0.5rem;
}

.back-link {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  padding: 0.45rem 0.9rem;
  transition: background-color var(--transition-base);
}

.back-link:hover {
  background-color: var(--color-gray-100);
}

.editor-form {
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .form-layout {
    grid-template-columns: 1fr;
  }
}

.form-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group--flex {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-gray-700);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-200);
  background-color: var(--color-white);
  color: var(--color-gray-900);
  font-size: var(--text-sm);
  transition: border-color var(--transition-base);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-gray-900);
}

.form-textarea {
  resize: vertical;
  line-height: 1.6;
}

.prompt-body {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  flex: 1;
  min-height: 300px;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-gray-100);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-primary {
  background-color: var(--color-black);
  color: var(--color-white);
  border: 1px solid var(--color-black);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-gray-800);
}

.btn-secondary {
  background-color: var(--color-white);
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-300);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-gray-50);
  border-color: var(--color-gray-400);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
