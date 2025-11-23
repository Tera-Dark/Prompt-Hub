import type { AIConfig, AIModel } from '@/types/ai'

export class AIService {
  // Placeholder for future AI integration
  // This service will handle interactions with OpenAI, Gemini, etc.

  async generateText(prompt: string, config: AIConfig, modelId: string): Promise<string> {
    // Implementation will depend on the provider
    console.log('Generating text with', config, modelId, prompt)
    return 'AI generation not yet implemented'
  }

  async listModels(_config: AIConfig): Promise<AIModel[]> {
    // Fetch models from the provider
    return []
  }
}

export const aiService = new AIService()
