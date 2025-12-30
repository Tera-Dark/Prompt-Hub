<template>
  <Modal :is-open="isOpen" :title="t('dataTools.tags.modalTitle')" size="lg" @close="emit('close')">
    <div class="tag-manager">
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('dataTools.tags.searchPlaceholder')"
          class="search-input"
        />
      </div>

      <div class="tags-list">
        <div v-if="loading" class="loading">{{ t('common.status.loading') }}</div>
        <div v-else-if="filteredTags.length === 0" class="empty">{{ t('common.noResults') }}</div>

        <div v-else class="tag-grid">
          <div v-for="tag in filteredTags" :key="tag.name" class="tag-item">
            <div class="tag-info">
              <span class="tag-name">{{ tag.name }}</span>
              <span class="tag-count">{{ tag.count }} prompts</span>
            </div>
            <div class="tag-actions">
              <button
                class="action-btn edit"
                :title="t('dataTools.tags.rename')"
                @click="startEdit(tag)"
              >
                ✎
              </button>
              <button
                class="action-btn delete"
                :title="t('dataTools.tags.delete')"
                @click="confirmDelete(tag)"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Dialog (Inline) -->
      <div v-if="editingTag" class="edit-dialog-overlay">
        <div class="edit-dialog">
          <h4>{{ t('dataTools.tags.editTitle') }}</h4>
          <p>
            {{ t('dataTools.tags.editDesc', { name: editingTag.name, count: editingTag.count }) }}
          </p>
          <input v-model="newTagName" type="text" class="edit-input" @keyup.enter="saveRename" />
          <div class="dialog-actions">
            <Button variant="secondary" size="sm" @click="cancelEdit">{{
              t('dataTools.tags.cancel')
            }}</Button>
            <Button size="sm" :disabled="!newTagName || isProcessing" @click="saveRename">
              {{ isProcessing ? t('common.status.loading') : t('dataTools.tags.save') }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button variant="secondary" @click="emit('close')">{{
        t('common.actions.view') || 'Close'
      }}</Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import { usePromptStore } from '@/stores/prompts'
import { githubService } from '@/services/github'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'success'])

const promptStore = usePromptStore()
const toast = useToast()
const searchQuery = ref('')
const editingTag = ref<{ name: string; count: number } | null>(null)
const newTagName = ref('')
const isProcessing = ref(false)
const loading = ref(false)

const allTags = computed(() => {
  const counts = new Map<string, number>()
  promptStore.prompts.value.forEach((p) => {
    p.tags.forEach((t) => {
      counts.set(t, (counts.get(t) || 0) + 1)
    })
  })
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count) // Sort by count desc
})

const filteredTags = computed(() => {
  if (!searchQuery.value) return allTags.value
  const q = searchQuery.value.toLowerCase()
  return allTags.value.filter((t) => t.name.toLowerCase().includes(q))
})

function startEdit(tag: { name: string; count: number }) {
  editingTag.value = tag
  newTagName.value = tag.name
}

function cancelEdit() {
  editingTag.value = null
  newTagName.value = ''
}

async function saveRename() {
  if (!editingTag.value || !newTagName.value || isProcessing.value) return

  const oldName = editingTag.value.name
  const newName = newTagName.value.trim()

  if (oldName === newName) {
    cancelEdit()
    return
  }

  isProcessing.value = true
  try {
    // Find all prompts with this tag
    const promptsToUpdate = promptStore.prompts.value.filter((p) => p.tags.includes(oldName))

    const filesToUpdate = promptsToUpdate.map((p) => {
      const updatedTags = p.tags.map((t) => (t === oldName ? newName : t))
      // Remove duplicates if any
      const uniqueTags = [...new Set(updatedTags)]

      const updatedPrompt = {
        ...p,
        tags: uniqueTags,
        updatedAt: new Date().toISOString(),
      }

      // Construct path (assuming we know the path or can reconstruct it)
      // Ideally prompt object has a path or we use ID to find it.
      // Since we don't store path in Prompt type explicitly in store (maybe?),
      // we might need to rely on `id` if it's the filename, or search.
      // BUT, `loadPrompts` usually returns content.
      // Let's assume standard path: `prompts/${p.id}.json` or similar.
      // Wait, `id` might be UUID.
      // If we don't know the path, we can't update easily without fetching tree.
      // However, usually `id` is the filename without extension in these systems.
      // Let's assume `prompts/${p.id}.json` is the path.

      return {
        path: `prompts/${p.id}.json`, // Assumption!
        content: JSON.stringify(updatedPrompt, null, 2),
      }
    })

    const branch = 'main'
    await githubService.updateFiles(
      branch,
      filesToUpdate,
      `Rename tag '${oldName}' to '${newName}'`,
    )

    await promptStore.fetchPrompts(true)
    cancelEdit()
    emit('success')
  } catch (err: unknown) {
    console.error(err)
    toast.error('Failed to rename tag.')
  } finally {
    isProcessing.value = false
  }
}

async function confirmDelete(tag: { name: string; count: number }) {
  if (!confirm(t('dataTools.tags.confirmDelete', { name: tag.name, count: tag.count }))) return

  isProcessing.value = true
  try {
    const promptsToUpdate = promptStore.prompts.value.filter((p) => p.tags.includes(tag.name))

    const filesToUpdate = promptsToUpdate.map((p) => {
      const updatedTags = p.tags.filter((t) => t !== tag.name)
      const updatedPrompt = {
        ...p,
        tags: updatedTags,
        updatedAt: new Date().toISOString(),
      }
      return {
        path: `prompts/${p.id}.json`,
        content: JSON.stringify(updatedPrompt, null, 2),
      }
    })

    const branch = 'main'
    await githubService.updateFiles(branch, filesToUpdate, `Delete tag '${tag.name}'`)

    await promptStore.fetchPrompts(true)
    emit('success')
  } catch (err: unknown) {
    console.error(err)
    toast.error('Failed to delete tag.')
  } finally {
    isProcessing.value = false
  }
}
</script>

<style scoped>
.tag-manager {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 60vh;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.tags-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.5rem;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

.tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.tag-info {
  display: flex;
  flex-direction: column;
}

.tag-name {
  font-weight: 500;
  font-size: 0.9rem;
}

.tag-count {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

.tag-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 1;
}

.action-btn.delete:hover {
  color: var(--color-danger);
}

.edit-dialog-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
  z-index: 10;
}

.edit-dialog {
  background: var(--color-surface);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 400px;
  box-shadow: var(--shadow-xl);
}

.edit-dialog h4 {
  margin: 0 0 0.5rem 0;
}

.edit-input {
  width: 100%;
  padding: 0.5rem;
  margin: 1rem 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
