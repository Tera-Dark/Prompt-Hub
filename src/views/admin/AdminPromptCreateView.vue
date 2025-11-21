<template>
  <section class="prompt-editor">
    <header class="editor-header">
      <div>
        <h2>New prompt</h2>
        <p>Draft a new prompt template. Fields are placeholders until the API is ready.</p>
      </div>
      <RouterLink to="/admin/prompts" class="back-link">Back to list</RouterLink>
    </header>

    <form class="editor-form" @submit.prevent="onSubmit">
      <div class="form-grid">
        <label class="form-field">
          <span>Title</span>
          <input v-model="form.title" type="text" placeholder="e.g. Product launch teaser" />
        </label>
        <label class="form-field">
          <span>Category</span>
          <select v-model="form.category">
            <option value="" disabled>Select category</option>
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>
        <label class="form-field">
          <span>Status</span>
          <select v-model="form.status">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label class="form-field form-field--full">
          <span>Description</span>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Short summary for the library"
          ></textarea>
        </label>
        <label class="form-field form-field--full">
          <span>Prompt body</span>
          <textarea
            v-model="form.prompt"
            rows="8"
            placeholder="Prompt instructions will be entered here"
          ></textarea>
        </label>
        <label class="form-field form-field--full">
          <span>Tags</span>
          <input v-model="tagsInput" type="text" placeholder="comma, separated" />
        </label>
      </div>
      <div class="form-actions">
        <button type="button" class="secondary" :disabled="submitting" @click="saveDraft">
          Save draft
        </button>
        <button type="submit" class="primary" :disabled="submitting">Publish</button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePrompts } from '@/composables/usePrompts'
import { useAuth } from '@/composables/useAuth'
import { type Prompt } from '@/types/prompt'
import { addPrompt } from '@/repositories/prompts'

const { categories } = usePrompts()
const { token, hasRepoWriteAccess } = useAuth()

const form = ref({
  title: '',
  category: '',
  description: '',
  prompt: '',
  status: 'draft' as 'draft' | 'published',
})
const tagsInput = ref('')
const submitting = ref(false)

// repo info handled in repository layer

function ensureAuth() {
  if (!token.value || !hasRepoWriteAccess.value) throw new Error('需要登录并具备仓库写权限')
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
  if (!form.value.title.trim()) return '标题必填'
  if (!form.value.category.trim()) return '类目必选'
  if (!form.value.description.trim()) return '描述必填'
  if (!form.value.prompt.trim()) return '正文必填'
  return null
}

async function saveDraft() {
  await handleSubmit(true)
}

function onSubmit(_e: SubmitEvent) {
  handleSubmit()
}

async function handleSubmit(_draft = false) {
  ensureAuth()
  const err = validate()
  if (err) throw new Error(err)
  submitting.value = true
  try {
    const t = token.value!
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
    }
    const url = await addPrompt(newItem, t)
    alert(`Pull Request 已创建：\n${url}`)
    form.value = { title: '', category: '', description: '', prompt: '', status: 'draft' }
    tagsInput.value = ''
  } catch (e) {
    const msg = e instanceof Error ? e.message : '提交失败'
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

.back-link:hover,
.back-link:focus-visible {
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
  gap: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field span {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-gray-700);
}

input,
textarea {
  width: 100%;
  padding: 0.75rem 0.85rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-200);
  background-color: var(--color-white);
  color: var(--color-gray-900);
  font-size: var(--text-sm);
  resize: vertical;
}

select {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-200);
  background-color: var(--color-white);
  color: var(--color-gray-900);
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
}

.primary,
.secondary {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  border: 1px solid var(--color-gray-900);
  transition:
    background-color var(--transition-base),
    color var(--transition-base);
}

.primary {
  background-color: var(--color-black);
  color: var(--color-white);
}

.primary:hover,
.primary:focus-visible {
  background-color: var(--color-gray-900);
}

.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary {
  background-color: var(--color-white);
  color: var(--color-gray-900);
}

.secondary:hover,
.secondary:focus-visible {
  background-color: var(--color-gray-100);
}

@media (max-width: 720px) {
  .editor-form {
    padding: 1.5rem;
  }
}
</style>
