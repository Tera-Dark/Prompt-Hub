<template>
  <Modal :is-open="isOpen" :title="t('dataTools.import.modalTitle')" @close="emit('close')">
    <div class="import-modal">
      <div class="upload-section">
        <label class="file-drop-zone" :class="{ 'is-dragover': isDragOver }">
          <input
            type="file"
            accept=".json"
            class="file-input"
            @change="handleFileSelect"
            @dragenter="isDragOver = true"
            @dragleave="isDragOver = false"
            @drop="isDragOver = false"
          />
          <div class="drop-content">
            <span class="icon">📂</span>
            <p v-if="!selectedFile">{{ t('dataTools.import.dragDrop') }}</p>
            <p v-else class="file-name">{{ selectedFile.name }}</p>
          </div>
        </label>
      </div>

      <div v-if="parsedPrompts.length > 0" class="preview-section">
        <h4>{{ t('dataTools.import.preview', { count: parsedPrompts.length }) }}</h4>
        <div class="preview-list">
          <div v-for="(p, i) in parsedPrompts.slice(0, 5)" :key="i" class="preview-item">
            <strong>{{ p.title }}</strong>
            <span class="preview-tags">{{ p.tags?.join(', ') }}</span>
          </div>
          <div v-if="parsedPrompts.length > 5" class="more-count">
            +{{ parsedPrompts.length - 5 }} more...
          </div>
        </div>
      </div>

      <div v-if="error" class="error-msg">
        {{ error }}
      </div>
    </div>

    <template #footer>
      <Button variant="secondary" @click="emit('close')">{{
        t('common.actions.cancel') || 'Cancel'
      }}</Button>
      <Button :disabled="!parsedPrompts.length || isImporting" @click="importPrompts">
        {{ isImporting ? t('dataTools.import.importing') : t('dataTools.import.action') }}
      </Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import { githubService } from '@/services/github'
import { usePromptStore } from '@/stores/prompts'

const { t } = useI18n()

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'success'])

const isDragOver = ref(false)
const selectedFile = ref<File | null>(null)
const parsedPrompts = ref<any[]>([])
const error = ref('')
const isImporting = ref(false)
const promptStore = usePromptStore()

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    processFile(input.files[0])
  }
}

function processFile(file: File) {
  selectedFile.value = file
  error.value = ''
  parsedPrompts.value = []

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target?.result as string)
      if (Array.isArray(json)) {
        parsedPrompts.value = json.filter((p) => p.title && p.prompt)
      } else {
        error.value = 'Invalid JSON format. Expected an array of prompts.'
      }
    } catch (err) {
      error.value = 'Failed to parse JSON file.'
    }
  }
  reader.readAsText(file)
}

async function importPrompts() {
  if (parsedPrompts.value.length === 0) return

  isImporting.value = true
  error.value = ''

  try {
    // Prepare files for GitHub update
    // We need to generate unique filenames for each prompt
    const filesToCreate = parsedPrompts.value.map((p) => {
      // Generate a safe filename
      const safeTitle = p.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      const filename = `prompts/${safeTitle}-${Date.now().toString().slice(-6)}.json`

      // Ensure required fields
      const promptData = {
        ...p,
        id: undefined, // Let system handle ID if needed, or keep it if migrating
        updatedAt: new Date().toISOString(),
        createdAt: p.createdAt || new Date().toISOString(),
      }

      return {
        path: filename,
        content: JSON.stringify(promptData, null, 2),
      }
    })

    // Use githubService to batch create files
    // We need to get the current branch first. Assuming 'main' or from env.
    const branch = 'main' // Should ideally get from config

    await githubService.updateFiles(
      branch,
      filesToCreate,
      `Batch import ${parsedPrompts.value.length} prompts`,
    )

    // Refresh store
    await promptStore.fetchPrompts(true)

    emit('success')
    emit('close')

    // Reset state
    selectedFile.value = null
    parsedPrompts.value = []
  } catch (err) {
    console.error(err)
    error.value = t('dataTools.import.error')
  } finally {
    isImporting.value = false
  }
}
</script>

<style scoped>
.import-modal {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.file-drop-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--color-surface-alt);
  display: block;
}

.file-drop-zone:hover,
.file-drop-zone.is-dragover {
  border-color: var(--color-primary);
  background: var(--color-primary-subtle);
}

.file-input {
  display: none;
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-secondary);
}

.icon {
  font-size: 2rem;
}

.file-name {
  font-weight: 600;
  color: var(--color-primary);
}

.preview-section {
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.preview-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid var(--color-border);
}

.preview-item:last-child {
  border-bottom: none;
}

.preview-tags {
  color: var(--color-text-tertiary);
  font-size: 0.75rem;
}

.more-count {
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-text-tertiary);
  margin-top: 0.5rem;
}

.error-msg {
  color: var(--color-danger);
  font-size: 0.9rem;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.75rem;
  border-radius: var(--radius-md);
}
</style>
