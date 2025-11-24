<template>
  <section class="prompt-editor">
    <header class="editor-header">
      <div>
        <h2>Edit prompt</h2>
        <p>
          Currently editing prompt <span class="prompt-id">#{{ id }}</span
          >. Content loading to be wired.
        </p>
      </div>
      <RouterLink to="/admin/prompts" class="back-link">Back to list</RouterLink>
    </header>

    <form class="editor-form" @submit.prevent="handleSubmit">
      <div class="form-grid">
        <label class="form-field">
          <span>Title</span>
          <input v-model="form.title" type="text" placeholder="Existing title will load here" />
        </label>
        <label class="form-field">
          <span>Status</span>
          <select v-model="status">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label class="form-field form-field--full">
          <span>Description</span>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Description is pending API data"
          ></textarea>
        </label>
        <label class="form-field form-field--full">
          <span>Prompt body</span>
          <textarea
            v-model="form.prompt"
            rows="8"
            placeholder="Prompt content will go here"
          ></textarea>
        </label>
        <label class="form-field form-field--full">
          <span>Tags</span>
          <input v-model="tagsInput" type="text" placeholder="Comma separated" />
        </label>
      </div>
      <div class="form-actions">
        <button type="button" class="secondary" :disabled="submitting" @click="saveChanges">
          Save changes
        </button>
        <button type="submit" class="primary" :disabled="submitting">Update prompt</button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { updatePromptById, loadPrompts } from '@/repositories/prompts'

const props = defineProps<{ id: string }>()
const { token, hasRepoWriteAccess } = useAuth()

const form = ref({ title: '', description: '', prompt: '' })
const status = ref<'draft' | 'published' | 'archived'>('published')
const tagsInput = ref('')
const submitting = ref(false)

// repo info handled in repository layer

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
      tagsInput.value = (p.tags || []).join(', ')
    }
  } catch {
    // Silently fail if prompt data cannot be loaded
  }
})

async function saveChanges() {
  await handleSubmit()
}

async function handleSubmit() {
  ensureAuth()
  submitting.value = true
  try {
    const t = token.value!
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
      t,
    )
    alert(`Pull Request 已创建：\n${url}`)
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
