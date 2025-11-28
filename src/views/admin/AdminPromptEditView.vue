<template>
  <section class="prompt-editor">
    <header class="editor-header">
      <div>
        <h2>Edit prompt</h2>
        <p>
          Currently editing prompt <span class="prompt-id">#{{ id }}</span>
        </p>
      </div>
      <div class="header-actions">
        <RouterLink to="/admin/prompts" class="back-link">
          {{ t('prompts.create.actions.back') }}
        </RouterLink>
      </div>
    </header>

    <div v-if="loading" class="loading-state">Loading prompt data...</div>
    <div v-else-if="error" class="error-state">
      {{ error }}
    </div>
    <form v-else class="editor-form" @submit.prevent="handleSubmit">
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
            <label class="form-label">{{ t('prompts.create.form.status') }}</label>
            <select v-model="status" class="form-select">
              <option value="draft">{{ t('prompts.create.form.statusOptions.draft') }}</option>
              <option value="published">
                {{ t('prompts.create.form.statusOptions.published') }}
              </option>
              <option value="archived">Archived</option>
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
            />
          </div>

          <div class="form-group form-group--flex">
            <label class="form-label">{{ t('prompts.create.form.body') }}</label>
            <textarea
              v-model="form.prompt"
              rows="15"
              :placeholder="t('prompts.create.form.bodyPlaceholder')"
              class="form-textarea prompt-body"
            />
          </div>
        </div>
      </div>

      <div class="form-footer">
        <button type="submit" class="btn btn-primary" :disabled="submitting">Update prompt</button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import { updatePromptById, loadPrompts } from '@/repositories/prompts'

const props = defineProps<{ id: string }>()
const { t } = useI18n()
const { token, hasRepoWriteAccess } = useAuth()

const form = ref({ title: '', description: '', prompt: '' })
const status = ref<'draft' | 'published' | 'archived'>('published')
const tagsInput = ref('')
const submitting = ref(false)
const loading = ref(true)
const error = ref<string | null>(null)

function ensureAuth() {
  if (!token.value || !hasRepoWriteAccess.value) throw new Error('需要登录并具备仓库写权限')
}

onMounted(async () => {
  try {
    const data = await loadPrompts()
    const p = data.prompts.find((x) => x.id === props.id)
    if (p) {
      form.value.title = p.title
      form.value.description = p.description
      form.value.prompt = p.prompt
      status.value = p.status || 'draft'
      tagsInput.value = (p.tags || []).join(', ')
    } else {
      error.value = `Prompt #${props.id} not found`
    }
  } catch (e) {
    console.error('Failed to load prompt', e)
    error.value = 'Failed to load prompt data. Please try again.'
  } finally {
    loading.value = false
  }
})

async function handleSubmit() {
  ensureAuth()
  submitting.value = true
  try {
    const authToken = token.value!
    const tags = tagsInput.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const now = new Date().toISOString()
    const url = await updatePromptById(
      props.id,
      (orig) => ({
        ...orig,
        title: form.value.title.trim(),
        description: form.value.description.trim(),
        prompt: form.value.prompt.trim(),
        tags,
        updatedAt: now,
        status: status.value,
      }),
      authToken,
    )
    alert(`Pull Request created: \n${url}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Submission failed'
    alert(msg)
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

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
  font-size: var(--text-lg);
  color: var(--color-gray-500);
  background: var(--color-gray-50);
  border-radius: var(--radius-lg);
}

.error-state {
  color: var(--color-red-600);
  background: var(--color-red-50);
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

.prompt-id {
  font-weight: 600;
  color: var(--color-gray-900);
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
