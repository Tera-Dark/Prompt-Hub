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
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      ],
      temperature: 0.7,
      maxTokens: 2000,
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
        { id: 'gemini-pro', name: 'Gemini Pro' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      ],
      temperature: 0.7,
      maxTokens: 2000,
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
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      ],
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
    },
  },
]
