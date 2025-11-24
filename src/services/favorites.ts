import type { Prompt } from '@/types/prompt'

const STORAGE_KEY = 'prompt-hub::favorites'

export const favoritesService = {
  getFavorites(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  isFavorite(promptId: string): boolean {
    const favorites = this.getFavorites()
    return favorites.includes(promptId)
  },

  toggleFavorite(promptId: string): boolean {
    const favorites = this.getFavorites()
    const index = favorites.indexOf(promptId)
    let isAdded = false

    if (index === -1) {
      favorites.push(promptId)
      isAdded = true
    } else {
      favorites.splice(index, 1)
      isAdded = false
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    return isAdded
  },

  getFavoritePrompts(allPrompts: Prompt[]): Prompt[] {
    const favoriteIds = this.getFavorites()
    return allPrompts.filter((p) => favoriteIds.includes(p.id))
  },
}
