export interface AIModel {
  id: string
  name: string
}

export interface AIConfig {
  apiKey: string
  baseUrl: string
  models: AIModel[]
  temperature?: number
  maxTokens?: number
  topP?: number
  presencePenalty?: number
  frequencyPenalty?: number
  systemPrompt?: string
}

export interface AIProvider {
  id: string
  name: string
  icon: string
  enabled: boolean
  config: AIConfig
}

export const DEFAULT_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
    enabled: true,
    config: {
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      models: [
        { id: 'gpt-5.1-thinking', name: 'GPT-5.1 Thinking' },
        { id: 'gpt-5.1-instant', name: 'GPT-5.1 Instant' },
        { id: 'gpt-5', name: 'GPT-5' },
        { id: 'gpt-4o', name: 'GPT-4o (Legacy)' },
      ],
      temperature: 0.7,
      maxTokens: 4000,
      topP: 1,
    },
  },
  {
    id: 'gemini',
    name: 'Gemini',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg',
    enabled: false,
    config: {
      apiKey: '',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      models: [
        { id: 'gemini-3.0-pro', name: 'Gemini 3.0 Pro' },
        { id: 'gemini-3.0-deep-think', name: 'Gemini 3.0 Deep Think' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      ],
      temperature: 0.7,
      maxTokens: 8192,
      topP: 1,
    },
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg',
    enabled: false,
    config: {
      apiKey: '',
      baseUrl: 'https://api.anthropic.com/v1',
      models: [
        { id: 'claude-4-5-opus-20251124', name: 'Claude 4.5 Opus' },
        { id: 'claude-4-5-sonnet-20251022', name: 'Claude 4.5 Sonnet' },
        { id: 'claude-4-5-haiku', name: 'Claude 4.5 Haiku' },
      ],
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1,
    },
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png', // Generic settings/slider icon
    enabled: false,
    config: {
      apiKey: '',
      baseUrl: 'http://localhost:8000/v1',
      models: [{ id: 'local-model', name: 'Local Model' }],
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
    },
  },
]
