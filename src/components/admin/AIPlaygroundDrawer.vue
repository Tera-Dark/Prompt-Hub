<template>
  <div class="drawer-backdrop" :class="{ 'is-open': isOpen }" @click="close">
    <div class="drawer-panel" @click.stop>
      <header class="drawer-header">
        <div class="header-title">
          <h3>{{ t('playground.title') }}</h3>
          <span class="badge">{{ t('common.status.beta') }}</span>
        </div>
        <div class="header-actions">
          <button class="icon-btn" :title="t('nav.aiSettings')" @click="openSettings">⚙️</button>
          <button class="icon-btn close-btn" @click="close">✕</button>
        </div>
      </header>

      <div class="drawer-content">
        <!-- Variables Section -->
        <div v-if="variables.length > 0" class="section">
          <h4>{{ t('playground.variables') }}</h4>
          <div class="variables-grid">
            <label v-for="v in variables" :key="v" class="variable-field">
              <span>{{ v }}</span>
              <input
                v-model="variableValues[v]"
                type="text"
                :placeholder="t('playground.variablePlaceholder', { name: v })"
              />
            </label>
          </div>
        </div>

        <!-- Manual Prompt Input (if no template) -->
        <div v-else class="section">
          <h4>{{ t('playground.promptLabel') }}</h4>
          <textarea
            v-model="manualPrompt"
            rows="6"
            :placeholder="t('playground.promptPlaceholder')"
          ></textarea>
        </div>

        <!-- System Prompt Override -->
        <div class="section">
          <h4>{{ t('playground.systemPromptLabel') }}</h4>
          <textarea
            v-model="systemPrompt"
            rows="3"
            :placeholder="t('playground.systemPromptPlaceholder')"
          ></textarea>
        </div>

        <!-- Output Section -->
        <div class="section output-section">
          <div class="section-header">
            <h4>{{ t('playground.outputLabel') }}</h4>
            <div v-if="loading" class="loading-spinner"></div>
          </div>
          <div class="output-box" :class="{ 'has-error': error }">
            <pre v-if="output">{{ output }}</pre>
            <div v-else-if="error" class="error-msg">{{ error }}</div>
            <div v-else class="placeholder">{{ t('playground.outputPlaceholder') }}</div>
          </div>
        </div>
      </div>

      <footer class="drawer-footer">
        <div class="provider-select">
          <select v-model="selectedProviderId">
            <option v-for="p in activeProviders" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
        </div>
        <div class="footer-buttons">
          <Button id="copy-btn" variant="secondary" :disabled="!canRun" @click="copyPrompt">
            {{ t('common.actions.copy') }}
          </Button>
          <Button :disabled="loading || !canRun || activeProviders.length === 0" @click="runPrompt">
            {{ loading ? t('playground.running') : t('playground.run') }}
          </Button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAIConfig } from '@/composables/useAIConfig'
import { aiService } from '@/services/ai'
import Button from '@/components/ui/Button.vue'

const props = defineProps<{
  isOpen: boolean
  promptTemplate: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()
const { t } = useI18n()
const { providers } = useAIConfig()
const selectedProviderId = ref('')
const variableValues = ref<Record<string, string>>({})
const manualPrompt = ref('')
const systemPrompt = ref('')
const output = ref('')
const error = ref('')
const loading = ref(false)

// Extract variables from prompt template {{variable}} or <variable>
const variables = computed(() => {
  // Match {{var}}
  const mustacheMatches = props.promptTemplate.match(/\{\{([^}]+)\}\}/g) || []
  const mustacheVars = mustacheMatches.map((m) => m.slice(2, -2).trim())

  // Match <var>
  const angleMatches = props.promptTemplate.match(/<([^>]+)>/g) || []
  const angleVars = angleMatches.map((m) => m.slice(1, -1).trim())

  return [...new Set([...mustacheVars, ...angleVars])]
})

const activeProviders = computed(() => providers.value.filter((p) => p.enabled))
const canRun = computed(() => {
  if (props.promptTemplate) return true
  return manualPrompt.value.trim().length > 0
})

// Auto-select first active provider
watch(
  activeProviders,
  (list) => {
    if (list.length > 0 && !selectedProviderId.value) {
      selectedProviderId.value = list[0].id
    }
  },
  { immediate: true },
)

function close() {
  emit('close')
}

function openSettings() {
  router.push('/admin/ai-settings')
  close()
}

function getFinalPrompt() {
  let finalPrompt = props.promptTemplate
  if (finalPrompt) {
    for (const v of variables.value) {
      const val = variableValues.value[v] || ''
      // Replace {{var}}
      finalPrompt = finalPrompt.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), val)
      // Replace <var>
      finalPrompt = finalPrompt.replace(new RegExp(`<${v}>`, 'g'), val)
    }
  } else {
    finalPrompt = manualPrompt.value
  }
  return finalPrompt
}

async function copyPrompt() {
  const text = getFinalPrompt()
  try {
    await navigator.clipboard.writeText(text)
    // Optional: Show toast (we can reuse a simple alert or assume success)
    // For better UX, change button text momentarily
    const btn = document.getElementById('copy-btn')
    if (btn) {
      const originalText = btn.innerText
      btn.innerText = t('common.actions.copied')
      setTimeout(() => {
        btn.innerText = originalText
      }, 2000)
    }
  } catch (err) {
    console.error('Failed to copy', err)
  }
}

async function runPrompt() {
  if (!selectedProviderId.value) return

  loading.value = true
  output.value = ''
  error.value = ''

  try {
    const finalPrompt = getFinalPrompt()

    const provider = providers.value.find((p) => p.id === selectedProviderId.value)
    if (!provider) throw new Error('Provider not found')

    const result = await aiService.generateText({
      provider: provider.id,
      model: provider.config.models[0]?.id || 'default', // Simplification: use first model
      messages: [
        { role: 'system', content: systemPrompt.value || 'You are a helpful assistant.' },
        { role: 'user', content: finalPrompt },
      ],
      config: {
        temperature: provider.config.temperature,
        maxTokens: provider.config.maxTokens,
        topP: provider.config.topP,
      },
    })

    output.value = result.text
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to generate text'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 50;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.drawer-backdrop.is-open {
  opacity: 1;
  pointer-events: auto;
}

.drawer-panel {
  position: absolute;
  top: 0;
  left: 0; /* Left side drawer */
  bottom: 0;
  width: 400px;
  max-width: 100%;
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@media (max-width: 480px) {
  .drawer-panel {
    width: 100%;
  }
}

.drawer-backdrop.is-open .drawer-panel {
  transform: translateX(0);
}

.drawer-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-surface-alt);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.drawer-header h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.badge {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  border-radius: 999px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  transition: all 0.2s;
  font-size: 1.1rem;
}

.icon-btn:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.close-btn {
  font-size: 1.25rem;
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: var(--color-surface);
}

.section h4 {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.variables-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.variable-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.variable-field span {
  font-size: var(--text-xs);
  font-family: monospace;
  color: var(--color-primary);
  background: var(--color-primary-subtle);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  align-self: flex-start;
}

input,
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
  font-size: var(--text-sm);
  transition: border-color 0.2s;
}

input:focus,
textarea:focus {
  border-color: var(--color-primary);
  outline: none;
}

.output-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.output-box {
  flex: 1;
  background: #1e1e1e;
  color: #e0e0e0;
  border-radius: var(--radius-md);
  padding: 1.25rem;
  font-family: 'Fira Code', monospace;
  font-size: var(--text-sm);
  line-height: 1.6;
  overflow-y: auto;
  min-height: 250px;
  border: 1px solid var(--color-border);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.output-box pre {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.placeholder {
  color: var(--color-gray-500);
  font-style: italic;
}

.error-msg {
  color: var(--color-danger);
}

.drawer-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-gray-50);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.provider-select select {
  padding: 0.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-300);
  background: var(--color-white);
  font-size: 0.9rem;
}

.footer-buttons {
  display: flex;
  gap: 0.5rem;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
