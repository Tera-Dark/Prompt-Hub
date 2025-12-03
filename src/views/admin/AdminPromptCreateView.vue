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
      <!-- Template Type Toggle -->
      <div class="template-toggle">
        <label class="toggle-label">{{ t('prompts.create.aiPainting.templateType') }}:</label>
        <div class="toggle-options">
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: form.templateType === 'text' }"
            @click="form.templateType = 'text'"
          >
            <Icon name="file-text" :size="16" />
            {{ t('prompts.create.aiPainting.textPrompt') }}
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: form.templateType === 'ai-painting' }"
            @click="form.templateType = 'ai-painting'"
          >
            <Icon name="palette" :size="16" />
            {{ t('prompts.create.aiPainting.aiPainting') }}
          </button>
        </div>
      </div>

      <div class="form-layout">
        <!-- Left Column: Metadata -->
        <aside class="form-sidebar">
          <div class="form-group">
            <label class="form-label"
              >{{ t('prompts.create.form.title') }} <span class="required">*</span></label
            >
            <input
              v-model="form.title"
              type="text"
              :placeholder="t('prompts.create.form.titlePlaceholder')"
              class="form-input"
            />
          </div>

          <div v-if="form.templateType === 'ai-painting'" class="form-group">
            <label class="form-label"
              >{{ t('prompts.create.aiPainting.baseModel') }} <span class="required">*</span></label
            >
            <input
              v-model="form.baseModel"
              type="text"
              placeholder="e.g. Stable Diffusion XL"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label class="form-label"
              >{{ t('prompts.create.form.category') }} <span class="required">*</span></label
            >
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

          <div class="form-group">
            <label class="form-label"
              >{{ t('prompts.create.form.images') }}
              <span v-if="form.templateType === 'ai-painting'" class="required">*</span></label
            >
            <ImageUploader
              v-model="form.images"
              :limit="1"
              :token="token || ''"
              @file-selected="handleFileSelected"
            />
          </div>
        </aside>

        <!-- Right Column: Content -->
        <div class="form-main">
          <div class="form-group">
            <label class="form-label"
              >{{ t('prompts.create.form.description') }} <span class="required">*</span></label
            >
            <textarea
              v-model="form.description"
              rows="3"
              :placeholder="t('prompts.create.form.descriptionPlaceholder')"
              class="form-textarea"
            ></textarea>
          </div>

          <div class="form-group form-group--flex">
            <label class="form-label">
              {{
                form.templateType === 'ai-painting'
                  ? t('prompts.create.aiPainting.textPrompt')
                  : t('prompts.create.form.body')
              }}
              <span class="required">*</span>
            </label>
            <textarea
              v-model="form.prompt"
              rows="10"
              :placeholder="t('prompts.create.form.bodyPlaceholder')"
              class="form-textarea prompt-body"
            ></textarea>
          </div>

          <div v-if="form.templateType === 'ai-painting'" class="form-group">
            <label class="form-label">{{ t('prompts.create.aiPainting.negativePrompt') }}</label>
            <textarea
              v-model="form.negativePrompt"
              rows="5"
              placeholder="Enter negative prompt..."
              class="form-textarea prompt-body"
            ></textarea>
          </div>

          <!-- AI Painting Parameters -->
          <div v-if="form.templateType === 'ai-painting'" class="params-grid">
            <div class="form-group">
              <label class="form-label">{{ t('prompts.create.aiPainting.resolution') }}</label>
              <input
                v-model="form.resolution"
                type="text"
                placeholder="e.g. 1024x1024"
                class="form-input"
                disabled
              />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('prompts.create.aiPainting.steps') }}</label>
              <input v-model.number="form.steps" type="number" class="form-input" disabled />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('prompts.create.aiPainting.cfg') }}</label>
              <input
                v-model.number="form.cfg"
                type="number"
                step="0.1"
                class="form-input"
                disabled
              />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('prompts.create.aiPainting.sampler') }}</label>
              <input v-model="form.sampler" type="text" class="form-input" disabled />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('prompts.create.aiPainting.seed') }}</label>
              <input v-model="form.seed" type="text" class="form-input" disabled />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('prompts.create.aiPainting.modelHash') }}</label>
              <input v-model="form.modelHash" type="text" class="form-input" disabled />
            </div>
          </div>
        </div>
      </div>

      <div class="form-footer">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="submitting"
          @click="() => saveDraft()"
        >
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
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { usePrompts } from '@/composables/usePrompts'
import { useAuth } from '@/composables/useAuth'
import { type Prompt, type AIPaintingConfig } from '@/types/prompt'
import { addPrompt, submitPromptIssue } from '@/repositories/prompts'
import { useToast } from '@/composables/useToast'
import { useLocalDrafts } from '@/composables/useLocalDrafts'
import { extractSDMetadata } from '@/utils/imageMetadata'

import ImageUploader from '@/components/ui/ImageUploader.vue'
import Icon from '@/components/ui/Icon.vue'

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
  templateType: 'text' as 'text' | 'ai-painting',
  title: '',
  category: '',
  description: '',
  prompt: '',
  status: 'draft' as 'draft' | 'published' | 'archived',
  images: [] as string[],
  // AI Painting Fields
  baseModel: '',
  negativePrompt: '',
  resolution: '',
  steps: null as number | null,
  cfg: null as number | null,
  sampler: '',
  seed: '',
  modelHash: '',
})
const tagsInput = ref('')
const submitting = ref(false)
const currentDraftId = ref<string | null>(null)

// Watch template type to auto-set category
watch(
  () => form.value.templateType,
  (newType) => {
    if (newType === 'ai-painting') {
      form.value.category = 'AI Painting'
    } else if (form.value.category === 'AI Painting') {
      form.value.category = ''
    }
  },
)

onMounted(() => {
  const draftId = route.query.draftId as string
  if (draftId) {
    const draft = getDraft(draftId)
    if (draft) {
      currentDraftId.value = draftId
      form.value = {
        ...form.value,
        title: draft.title,
        category: draft.category,
        description: draft.description,
        prompt: draft.prompt,
        status: draft.status as any,
        images: draft.images || (draft.imageUrl ? [draft.imageUrl] : []),
        templateType: draft.aiPaintingConfig ? 'ai-painting' : 'text',
        // Restore AI Painting fields
        baseModel: draft.aiPaintingConfig?.baseModel || '',
        negativePrompt: draft.aiPaintingConfig?.negativePrompt || '',
        resolution: draft.aiPaintingConfig?.resolution || '',
        steps: draft.aiPaintingConfig?.steps || null,
        cfg: draft.aiPaintingConfig?.cfg || null,
        sampler: draft.aiPaintingConfig?.sampler || '',
        seed: draft.aiPaintingConfig?.seed || '',
        modelHash: draft.aiPaintingConfig?.modelHash || '',
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
  if (!form.value.prompt.trim()) return 'Prompt body (Positive Prompt) is required'

  if (form.value.templateType === 'ai-painting') {
    if (!form.value.baseModel.trim()) return 'Base Model is required'
    if (form.value.images.length === 0) return 'Image is required for AI Painting'
  }

  return null
}

async function handleFileSelected(file: File) {
  if (form.value.templateType !== 'ai-painting') return

  try {
    const metadata = await extractSDMetadata(file)
    if (metadata) {
      console.log('Found metadata:', metadata)

      // Construct prompt with LoRAs if available
      let finalPrompt = metadata.prompt
      if (metadata.loras && metadata.loras.length > 0) {
        const loraString = metadata.loras.map((l) => `<lora:${l}>`).join(' ')
        finalPrompt = finalPrompt + '\n' + loraString
      }

      if (finalPrompt) form.value.prompt = finalPrompt
      if (metadata.negativePrompt) form.value.negativePrompt = metadata.negativePrompt
      if (metadata.steps) form.value.steps = metadata.steps
      if (metadata.sampler) form.value.sampler = metadata.sampler
      if (metadata.cfg) form.value.cfg = metadata.cfg
      if (metadata.seed) form.value.seed = metadata.seed
      if (metadata.modelHash) form.value.modelHash = metadata.modelHash
      if (metadata.model) form.value.baseModel = metadata.model
      if (metadata.size) form.value.resolution = metadata.size

      toast.success(t('prompts.create.aiPainting.autoFillSuccess'))
    } else {
      console.log('No metadata found')
    }
  } catch (e) {
    console.error('Error extracting metadata:', e)
  }
}

async function saveDraft(updateUrl = true) {
  const id = saveLocalDraft({
    id: currentDraftId.value || undefined,
    title: form.value.title,
    category: form.value.category,
    description: form.value.description,
    prompt: form.value.prompt,
    tags: tagsInput.value,
    status: form.value.status,
    images: form.value.images,
    imageUrl: form.value.images[0] || '',
    aiPaintingConfig:
      form.value.templateType === 'ai-painting'
        ? {
            baseModel: form.value.baseModel,
            negativePrompt: form.value.negativePrompt,
            resolution: form.value.resolution,
            steps: form.value.steps,
            cfg: form.value.cfg,
            sampler: form.value.sampler,
            seed: form.value.seed,
            modelHash: form.value.modelHash,
          }
        : undefined,
  })

  if (id) {
    currentDraftId.value = id
    // Update URL without reload only if requested
    if (updateUrl) {
      router.replace({ query: { ...route.query, draftId: id } })
    }
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
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
    const now = new Date().toISOString()

    let aiPaintingConfig: AIPaintingConfig | undefined
    if (form.value.templateType === 'ai-painting') {
      aiPaintingConfig = {
        baseModel: form.value.baseModel,
        negativePrompt: form.value.negativePrompt,
        resolution: form.value.resolution,
        steps: form.value.steps || undefined,
        cfg: form.value.cfg || undefined,
        sampler: form.value.sampler,
        seed: form.value.seed,
        modelHash: form.value.modelHash,
      }
    }

    const newItem: Prompt = {
      id: genId(form.value.title, form.value.category),
      title: form.value.title.trim(),
      category: form.value.category.trim(),
      description: form.value.description.trim(),
      prompt: form.value.prompt.trim(),
      tags,
      createdAt: now,
      status: form.value.status,
      images: form.value.images,
      imageUrl: form.value.images[0], // Backward compatibility
      aiPaintingConfig,
      author: user.value
        ? {
            username: user.value.login,
            avatarUrl: user.value.avatar_url || undefined,
          }
        : undefined,
    }

    // Debug logging
    console.log('📤 Submitting prompt:', newItem)

    if (hasRepoWriteAccess.value) {
      try {
        await addPrompt(newItem, authToken, true)
        toast.success(t('prompts.create.actions.directCommitSuccess') || 'Published successfully')
      } catch (e) {
        console.warn('Direct commit failed, trying issue submission:', e)
        const msg = e instanceof Error ? e.message : String(e)
        // If it's a 404/403 on git/refs, it means we don't have write access
        if (msg.includes('Not Found') || msg.includes('403') || msg.includes('404')) {
          await submitPromptIssue(newItem, authToken)
          toast.success(
            t('prompts.create.actions.issueCreated') || 'Submission received for review',
          )
        } else {
          throw e
        }
      }
    } else {
      // Regular users submit an issue
      await submitPromptIssue(newItem, authToken)
      toast.success(t('prompts.create.actions.issueCreated') || 'Submission received for review')
    }

    // Clear form and draft
    if (currentDraftId.value) {
      deleteDraft(currentDraftId.value)
      currentDraftId.value = null
    }

    form.value = {
      templateType: 'text',
      title: '',
      category: '',
      description: '',
      prompt: '',
      status: 'draft',
      images: [],
      baseModel: '',
      negativePrompt: '',
      resolution: '',
      steps: null,
      cfg: null,
      sampler: '',
      seed: '',
      modelHash: '',
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

onBeforeRouteLeave((_to, _from, next) => {
  // If submitting, don't save draft (it's being published)
  if (submitting.value) {
    next()
    return
  }

  // Check if form has any content
  const hasContent =
    form.value.title.trim() ||
    form.value.description.trim() ||
    form.value.prompt.trim() ||
    form.value.images.length > 0

  if (hasContent) {
    // Auto-save draft but DO NOT update URL (avoids navigation conflict)
    saveDraft(false)
  }

  next()
})
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

  .editor-form {
    padding: 1.5rem;
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

.form-input:disabled,
.form-select:disabled,
.form-textarea:disabled {
  background-color: var(--color-gray-100);
  color: var(--color-gray-500);
  cursor: not-allowed;
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

.template-toggle {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  background: var(--color-gray-50);
  padding: 1rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-gray-200);
}

.toggle-label {
  font-weight: 600;
  color: var(--color-gray-700);
}

.toggle-options {
  display: flex;
  gap: 0.5rem;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  background: var(--color-white);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--color-gray-600);
}

.toggle-btn:hover {
  background: var(--color-gray-100);
}

.toggle-btn.active {
  background: var(--color-black);
  color: var(--color-white);
  border-color: var(--color-black);
}

.required {
  color: #ef4444;
  margin-left: 0.25rem;
}

.params-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  background: var(--color-gray-50);
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-200);
}
</style>
