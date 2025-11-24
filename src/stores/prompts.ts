import { ref, computed } from 'vue'
import type { Prompt } from '@/types/prompt'
import { loadPrompts } from '@/repositories/prompts'
import { favoritesService } from '@/services/favorites'

const prompts = ref<Prompt[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const isLoaded = ref(false)

export function usePromptStore() {
  async function fetchPrompts() {
    if (isLoaded.value && prompts.value.length > 0) return

    isLoading.value = true
    error.value = null
    try {
      const data = await loadPrompts()
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
    const cats = new Set(prompts.value.map((p) => p.category))
    return Array.from(cats).sort()
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
