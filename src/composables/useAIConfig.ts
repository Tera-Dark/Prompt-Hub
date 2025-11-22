import { ref, watch } from 'vue'
import { type AIProvider, DEFAULT_PROVIDERS, type AIModel } from '@/types/ai'

const STORAGE_KEY = 'prompt-hub::ai-config'

export function useAIConfig() {
  const providers = ref<AIProvider[]>([])

  // Initialize from storage or defaults
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      // Merge stored config with defaults to ensure new providers/fields are added
      providers.value = DEFAULT_PROVIDERS.map((def) => {
        const existing = parsed.find((p: AIProvider) => p.id === def.id)
        return existing
          ? { ...def, ...existing, config: { ...def.config, ...existing.config } }
          : def
      })
    } catch (e) {
      console.error('Failed to parse AI config', e)
      providers.value = DEFAULT_PROVIDERS
    }
  } else {
    providers.value = DEFAULT_PROVIDERS
  }

  // Persist changes
  watch(
    providers,
    (newVal) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal))
    },
    { deep: true },
  )

  function getProvider(id: string) {
    return providers.value.find((p) => p.id === id)
  }

  function updateProviderConfig(id: string, config: Partial<AIProvider['config']>) {
    const provider = getProvider(id)
    if (provider) {
      provider.config = { ...provider.config, ...config }
    }
  }

  function toggleProvider(id: string, enabled: boolean) {
    const provider = getProvider(id)
    if (provider) {
      provider.enabled = enabled
    }
  }

  function addModel(providerId: string, model: AIModel) {
    const provider = getProvider(providerId)
    if (provider) {
      provider.config.models.push(model)
    }
  }

  function removeModel(providerId: string, modelId: string) {
    const provider = getProvider(providerId)
    if (provider) {
      provider.config.models = provider.config.models.filter((m) => m.id !== modelId)
    }
  }

  return {
    providers,
    getProvider,
    updateProviderConfig,
    toggleProvider,
    addModel,
    removeModel,
  }
}
