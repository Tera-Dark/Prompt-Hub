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
import { useScrollLock } from '@/composables/useScrollLock'
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

useScrollLock(computed(() => props.isOpen))

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
  if (!selectedProviderId.value) return false
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
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  z-index: 100;
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
  left: 0;
  bottom: 0;
  width: 450px;
  max-width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: 20px 0 40px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
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
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.5);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.drawer-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.badge {
  font-size: 0.65rem;
  padding: 0.15rem 0.5rem;
  background: var(--color-primary);
  color: white;
  border-radius: 999px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: var(--color-text-secondary);
  transition: all 0.2s;
  font-size: 1.1rem;
  background: transparent;
  border: 1px solid transparent;
}

.icon-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--color-text-primary);
  transform: scale(1.05);
}

.close-btn:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section h4 {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-tertiary);
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.variables-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.variable-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.variable-field span {
  font-size: 0.75rem;
  font-family: 'Fira Code', monospace;
  color: var(--color-primary);
  background: var(--color-primary-subtle);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  align-self: flex-start;
  font-weight: 500;
}

input,
textarea {
  width: 100%;
  padding: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  transition: all 0.2s;
  font-family: inherit;
}

input:focus,
textarea:focus {
  border-color: var(--color-primary);
  background: white;
  outline: none;
  box-shadow: 0 0 0 3px var(--color-primary-subtle);
}

.output-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 300px;
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
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  font-family: 'Fira Code', monospace;
  font-size: 0.85rem;
  line-height: 1.7;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.2);
}

.output-box pre {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.placeholder {
  color: #666;
  font-style: italic;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  opacity: 0.5;
}

.error-msg {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.drawer-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.provider-select {
  flex: 1;
}

.provider-select select {
  width: 100%;
  padding: 0.6rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: white;
  font-size: 0.85rem;
  cursor: pointer;
}

.footer-buttons {
  display: flex;
  gap: 0.75rem;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Scrollbar Styling */
.drawer-content::-webkit-scrollbar,
.output-box::-webkit-scrollbar {
  width: 6px;
}

.drawer-content::-webkit-scrollbar-track,
.output-box::-webkit-scrollbar-track {
  background: transparent;
}

.drawer-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.output-box::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
</style>
