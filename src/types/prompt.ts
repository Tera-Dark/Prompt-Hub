export interface Prompt {
  id: string;
  title: string;
  category: string;
  tags: string[];
  prompt: string;
  description: string;
  sourceLink?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PromptsData {
  prompts: Prompt[];
  version: string;
}

export class PromptLoadError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'PromptLoadError';
  }
}

export async function loadPrompts(): Promise<PromptsData> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/prompts.json`);
    
    if (!response.ok) {
      throw new PromptLoadError(
        `Failed to fetch prompts: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data || typeof data !== 'object') {
      throw new PromptLoadError('Invalid prompts data: expected an object');
    }

    if (!Array.isArray(data.prompts)) {
      throw new PromptLoadError('Invalid prompts data: prompts field must be an array');
    }

    return data as PromptsData;
  } catch (error) {
    if (error instanceof PromptLoadError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new PromptLoadError('Failed to load prompts data', error);
    }

    throw new PromptLoadError('An unknown error occurred while loading prompts');
  }
}

export function getPromptById(prompts: Prompt[], id: string): Prompt | undefined {
  return prompts.find(prompt => prompt.id === id);
}

export function getPromptsByCategory(prompts: Prompt[], category: string): Prompt[] {
  return prompts.filter(prompt => prompt.category === category);
}

export function getPromptsByTag(prompts: Prompt[], tag: string): Prompt[] {
  return prompts.filter(prompt => prompt.tags.includes(tag));
}

export function searchPrompts(prompts: Prompt[], query: string): Prompt[] {
  const lowerQuery = query.toLowerCase();
  return prompts.filter(prompt => 
    prompt.title.toLowerCase().includes(lowerQuery) ||
    prompt.description.toLowerCase().includes(lowerQuery) ||
    prompt.prompt.toLowerCase().includes(lowerQuery) ||
    prompt.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

export function getAllCategories(prompts: Prompt[]): string[] {
  const categories = new Set(prompts.map(prompt => prompt.category));
  return Array.from(categories).sort();
}

export function getAllTags(prompts: Prompt[]): string[] {
  const tags = new Set(prompts.flatMap(prompt => prompt.tags));
  return Array.from(tags).sort();
}
