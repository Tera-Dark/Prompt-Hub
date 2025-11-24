export interface Prompt {
  id: string
  title: string
  category: string
  tags: string[]
  prompt: string
  description: string
  sourceLink?: string
  createdAt: string
  updatedAt?: string
  views?: number
  likes?: number
  imageUrl?: string
  status?: 'draft' | 'published' | 'archived'
}

export interface PromptsData {
  prompts: Prompt[]
  version: string
}

export class PromptLoadError extends Error {
  constructor(
    message: string,
    public cause?: unknown,
  ) {
    super(message)
    this.name = 'PromptLoadError'
  }
}

export function getPromptById(prompts: Prompt[], id: string): Prompt | undefined {
  return prompts.find((prompt) => prompt.id === id)
}

export function getPromptsByCategory(prompts: Prompt[], category: string): Prompt[] {
  return prompts.filter((prompt) => prompt.category === category)
}

export function getPromptsByTag(prompts: Prompt[], tag: string): Prompt[] {
  return prompts.filter((prompt) => prompt.tags.includes(tag))
}

export function searchPrompts(prompts: Prompt[], query: string): Prompt[] {
  const lowerQuery = query.toLowerCase()
  return prompts.filter(
    (prompt) =>
      prompt.title.toLowerCase().includes(lowerQuery) ||
      prompt.description.toLowerCase().includes(lowerQuery) ||
      prompt.prompt.toLowerCase().includes(lowerQuery) ||
      prompt.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
  )
}

export function getAllCategories(prompts: Prompt[]): string[] {
  const categories = new Set(prompts.map((prompt) => prompt.category))
  return Array.from(categories).sort()
}

export function getAllTags(prompts: Prompt[]): string[] {
  const tags = new Set(prompts.flatMap((prompt) => prompt.tags))
  return Array.from(tags).sort()
}
