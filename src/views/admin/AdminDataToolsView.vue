<template>
  <section class="data-tools">
    <header class="tools-header">
      <h2>{{ t('dataTools.title') }}</h2>
      <p>{{ t('dataTools.subtitle') }}</p>
    </header>

    <div class="tools-grid">
      <!-- Batch Import -->
      <article class="tool-card">
        <div class="card-icon">📥</div>
        <h3>{{ t('dataTools.import.title') }}</h3>
        <p>{{ t('dataTools.import.desc') }}</p>
        <button type="button" class="tool-button" @click="isImportOpen = true">
          {{ t('dataTools.import.action') }}
        </button>
      </article>

      <!-- Tag Management -->
      <article class="tool-card">
        <div class="card-icon">🏷️</div>
        <h3>{{ t('dataTools.tags.title') }}</h3>
        <p>{{ t('dataTools.tags.desc') }}</p>
        <button type="button" class="tool-button" @click="isTagManagerOpen = true">
          {{ t('dataTools.tags.action') }}
        </button>
      </article>

      <!-- Link Validator -->
      <article class="tool-card">
        <div class="card-icon">🔗</div>
        <h3>{{ t('dataTools.links.title') }}</h3>
        <p>{{ t('dataTools.links.desc') }}</p>
        <button type="button" class="tool-button" @click="isLinkValidatorOpen = true">
          {{ t('dataTools.links.action') }}
        </button>
      </article>

      <!-- Export -->
      <article class="tool-card">
        <div class="card-icon">📤</div>
        <h3>{{ t('dataTools.exports.title') }}</h3>
        <p>{{ t('dataTools.exports.desc') }}</p>
        <div class="button-group">
          <button
            type="button"
            class="tool-button"
            :disabled="isExporting"
            @click="handleExport('json')"
          >
            {{ t('dataTools.exports.json') }}
          </button>
          <button
            type="button"
            class="tool-button outline"
            :disabled="isExporting"
            @click="handleExport('md')"
          >
            {{ t('dataTools.exports.markdown') }}
          </button>
        </div>
      </article>
    </div>

    <!-- Modals -->
    <ImportModal
      :is-open="isImportOpen"
      @close="isImportOpen = false"
      @success="showSuccess(t('dataTools.import.success'))"
    />
    <TagManagerModal
      :is-open="isTagManagerOpen"
      @close="isTagManagerOpen = false"
      @success="showSuccess(t('dataTools.tags.success'))"
    />
    <LinkValidatorModal :is-open="isLinkValidatorOpen" @close="isLinkValidatorOpen = false" />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePromptStore } from '@/stores/prompts'
import ImportModal from '@/components/admin/data/ImportModal.vue'
import TagManagerModal from '@/components/admin/data/TagManagerModal.vue'
import LinkValidatorModal from '@/components/admin/data/LinkValidatorModal.vue'

const { t } = useI18n()
const promptStore = usePromptStore()

const isImportOpen = ref(false)
const isTagManagerOpen = ref(false)
const isLinkValidatorOpen = ref(false)
const isExporting = ref(false)

function showSuccess(msg: string) {
  // Simple alert for now, could use toast if available
  alert(msg)
}

async function handleExport(format: 'json' | 'md') {
  if (isExporting.value) return
  isExporting.value = true

  try {
    // Ensure we have latest data
    await promptStore.fetchPrompts()
    const prompts = promptStore.prompts.value

    let content = ''
    let mimeType = ''
    let extension = ''

    if (format === 'json') {
      content = JSON.stringify(prompts, null, 2)
      mimeType = 'application/json'
      extension = 'json'
    } else if (format === 'md') {
      content = prompts
        .map((p) => {
          return `# ${p.title}
> ${p.description}

**Category**: ${p.category}
**Tags**: ${p.tags.join(', ')}
**Created**: ${p.createdAt}

## Prompt
\`\`\`
${p.prompt}
\`\`\`
---`
        })
        .join('\n\n')
      mimeType = 'text/markdown'
      extension = 'md'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `prompt-hub-export-${new Date().toISOString().split('T')[0]}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showSuccess(t('dataTools.exports.success'))
  } catch (e) {
    console.error('Export failed', e)
    alert(t('dataTools.exports.failed'))
  } finally {
    isExporting.value = false
  }
}
</script>

<style scoped>
.data-tools {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.tools-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.tools-header p {
  color: var(--color-text-tertiary);
  margin-top: 0.5rem;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.tool-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.tool-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.tool-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.tool-card p {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  flex: 1;
}

.tool-button {
  align-self: flex-start;
  padding: 0.65rem 1.1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-primary);
  background-color: var(--color-primary);
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-button:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.tool-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tool-button.outline {
  background-color: transparent;
  color: var(--color-primary);
}

.tool-button.outline:hover:not(:disabled) {
  background-color: var(--color-primary-subtle);
}

.button-group {
  display: flex;
  gap: 0.5rem;
}
</style>
