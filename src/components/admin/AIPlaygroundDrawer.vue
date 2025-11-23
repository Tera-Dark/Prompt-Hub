<template>
  <div class="drawer-backdrop" :class="{ 'is-open': isOpen }" @click="close">
    <div class="drawer-panel" @click.stop>
      <header class="drawer-header">
        <h3>AI Playground</h3>
        <button class="close-btn" @click="close">✕</button>
      </header>

      <div class="drawer-content">
        <!-- Variables Section -->
        <div v-if="variables.length > 0" class="section">
          <h4>Variables</h4>
          <div class="variables-grid">
            <label v-for="v in variables" :key="v" class="variable-field">
              <span>{{ v }}</span>
              <input v-model="variableValues[v]" type="text" :placeholder="`Value for {{${v}}}`" />
            </label>
          </div>
        </div>

        <!-- System Prompt Override -->
        <div class="section">
          <h4>System Prompt</h4>
          <textarea
            v-model="systemPrompt"
            rows="3"
            placeholder="Override system prompt (optional)"
          ></textarea>
        </div>

        <!-- Output Section -->
        <div class="section output-section">
          <div class="section-header">
            <h4>Output</h4>
            <div v-if="loading" class="loading-spinner"></div>
          </div>
          <div class="output-box" :class="{ 'has-error': error }">
            <pre v-if="output">{{ output }}</pre>
            <div v-else-if="error" class="error-msg">{{ error }}</div>
            <div v-else class="placeholder">Run the prompt to see output...</div>
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
        <Button :disabled="loading || !canRun" @click="runPrompt">
          {{ loading ? 'Running...' : 'Run' }}
        </Button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

const { providers } = useAIConfig()
const selectedProviderId = ref('')
const variableValues = ref<Record<string, string>>({})
const systemPrompt = ref('')
const output = ref('')
const error = ref('')
const loading = ref(false)

// Extract variables from prompt template {{variable}}
const variables = computed(() => {
  const matches = props.promptTemplate.match(/\{\{([^}]+)\}\}/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.slice(2, -2).trim()))]
})

const activeProviders = computed(() => providers.value.filter((p) => p.enabled))
const canRun = computed(() => activeProviders.value.length > 0 && props.promptTemplate.trim())

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

async function runPrompt() {
  if (!selectedProviderId.value) return

  loading.value = true
  output.value = ''
  error.value = ''

  try {
    // Interpolate variables
    let finalPrompt = props.promptTemplate
    for (const v of variables.value) {
      const val = variableValues.value[v] || ''
      finalPrompt = finalPrompt.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), val)
    }

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
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-backdrop.is-open .drawer-panel {
  transform: translateX(0);
}

.drawer-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-header h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  margin: 0;
}

.close-btn {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--color-text-primary);
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
  background: var(--color-black);
  color: var(--color-white);
  border-radius: var(--radius-md);
  padding: 1rem;
  font-family: monospace;
  font-size: var(--text-sm);
  overflow-y: auto;
  min-height: 200px;
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
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-surface);
}

.provider-select select {
  padding: 0.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
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
