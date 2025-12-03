<template>
  <Modal :is-open="isOpen" :title="t('dataTools.links.modalTitle')" size="lg" @close="emit('close')">
    <div class="link-validator">
      <div v-if="!isStarted" class="start-screen">
        <p>{{ t('dataTools.links.startDesc') }}</p>
        <p class="info">
          {{ t('dataTools.links.totalPrompts', { count: promptStore.prompts.value.length }) }}
        </p>
        <Button @click="startValidation">{{ t('dataTools.links.start') }}</Button>
      </div>

      <div v-else class="validation-screen">
        <div class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
          <div class="progress-text">
            {{ t('dataTools.links.progress', { current: processedCount, total: totalCount }) }}
          </div>
        </div>

        <div class="results-list">
          <div v-if="brokenLinks.length === 0 && isFinished" class="success-msg">
            {{ t('dataTools.links.noBroken') }}
          </div>

          <div v-for="(item, i) in brokenLinks" :key="i" class="broken-link-item">
            <div class="link-info">
              <span class="prompt-title">{{ item.promptTitle }}</span>
              <a :href="item.url" target="_blank" class="link-url">{{ item.url }}</a>
            </div>
            <span class="status-badge error">{{ item.status }}</span>
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

const { t } = useI18n()

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close'])

const promptStore = usePromptStore()
const isStarted = ref(false)
const isFinished = ref(false)
const processedCount = ref(0)
const brokenLinks = ref<{ promptTitle: string; url: string; status: number | string }[]>([])

const totalCount = computed(() => promptStore.prompts.value.length)
const progress = computed(() =>
  totalCount.value === 0 ? 0 : (processedCount.value / totalCount.value) * 100,
)

async function startValidation() {
  isStarted.value = true
  isFinished.value = false
  processedCount.value = 0
  brokenLinks.value = []

  const prompts = promptStore.prompts.value

  // Process in chunks to avoid blocking UI too much
  const chunkSize = 5
  for (let i = 0; i < prompts.length; i += chunkSize) {
    const chunk = prompts.slice(i, i + chunkSize)
    await Promise.all(chunk.map(checkPrompt))
    processedCount.value += chunk.length
    // Small delay to let UI update
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  isFinished.value = true
}

async function checkPrompt(prompt: any) {
  const urlsToCheck: string[] = []
  if (prompt.imageUrl) urlsToCheck.push(prompt.imageUrl)
  if (prompt.images && Array.isArray(prompt.images)) {
    urlsToCheck.push(...prompt.images)
  }

  for (const url of urlsToCheck) {
    if (!url) continue
    try {
      const res = await fetch(url, { method: 'HEAD' })
      if (!res.ok) {
        brokenLinks.value.push({
          promptTitle: prompt.title,
          url,
          status: res.status,
        })
      }
    } catch (err) {
      brokenLinks.value.push({
        promptTitle: prompt.title,
        url,
        status: 'Error',
      })
    }
  }
}
</script>

<style scoped>
.link-validator {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 300px;
}

.start-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 1rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.info {
  font-weight: 600;
  color: var(--color-text-primary);
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar {
  height: 8px;
  background: var(--color-surface-alt);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.2s;
}

.progress-text {
  font-size: 0.8rem;
  text-align: right;
  color: var(--color-text-tertiary);
}

.results-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.5rem;
  max-height: 400px;
}

.success-msg {
  text-align: center;
  padding: 2rem;
  color: var(--color-success);
  font-weight: 600;
}

.broken-link-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.broken-link-item:last-child {
  border-bottom: none;
}

.link-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow: hidden;
}

.prompt-title {
  font-weight: 500;
  font-size: 0.9rem;
}

.link-url {
  font-size: 0.8rem;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-weight: 600;
}

.status-badge.error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}
</style>
