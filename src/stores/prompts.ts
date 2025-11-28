import { ref, computed } from 'vue'
import type { Prompt } from '@/types/prompt'
import { loadPrompts } from '@/repositories/prompts'
import { favoritesService } from '@/services/favorites'

const prompts = ref<Prompt[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const isLoaded = ref(false)

export function usePromptStore() {
  async function fetchPrompts(force = false) {
    if (!force && isLoaded.value && prompts.value.length > 0) return

    isLoading.value = true
    error.value = null
    try {
      const data = await loadPrompts(force)
      prompts.value = data.prompts
      isLoaded.value = true
    } catch (e) {
      error.value = 'Failed to load prompts'
      console.error(e)
    } finally {
      isLoading.value = false
    }
  }

  const allPrompts = computed(() => prompts.value)

  const featuredPrompts = computed(() => {
    return prompts.value.slice(0, 3)
  })

  const categories = computed(() => {
    const counts = new Map<string, number>()
    prompts.value.forEach((p) => {
      const c = p.category
      counts.set(c, (counts.get(c) || 0) + 1)
    })

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  })

  function getFilteredPrompts(
    searchQuery: string,
    category: string | null,
    view: 'recommendations' | 'explore' | 'favorites',
  ) {
    let result = prompts.value

    if (view === 'favorites') {
      result = favoritesService.getFavoritePrompts(result)
    }

    if (category) {
      result = result.filter((p) => p.category === category)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }

    return result
  }

  return {
    prompts: allPrompts,
    featuredPrompts,
    categories,
    isLoading,
    error,
    fetchPrompts,
    getFilteredPrompts,
  }
}
