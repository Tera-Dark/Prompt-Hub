import type { Prompt } from '@/types/prompt'

const STORAGE_KEY = 'prompt-hub::user-interactions'

interface UserInteractions {
  categoryClicks: Record<string, number> // Category -> Count
  tagClicks: Record<string, number> // Tag -> Count
  viewedPrompts: string[]
  lastUpdated: number
}

export const recommendationService = {
  getInteractions(): UserInteractions {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return this.getEmptyInteractions()

      const parsed = JSON.parse(data)
      // Migration or fallback
      if (!parsed.tagClicks) parsed.tagClicks = {}
      if (!parsed.lastUpdated) parsed.lastUpdated = Date.now()

      return parsed
    } catch {
      return this.getEmptyInteractions()
    }
  },

  getEmptyInteractions(): UserInteractions {
    return {
      categoryClicks: {},
      tagClicks: {},
      viewedPrompts: [],
      lastUpdated: Date.now(),
    }
  },

  saveInteractions(data: UserInteractions) {
    data.lastUpdated = Date.now()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  },

  // Apply time decay to interests (e.g., reduce weights by 10% every 24h)
  applyDecay(data: UserInteractions) {
    const now = Date.now()
    const hoursSinceLastUpdate = (now - data.lastUpdated) / (1000 * 60 * 60)

    if (hoursSinceLastUpdate > 24) {
      const decayFactor = Math.pow(0.9, Math.floor(hoursSinceLastUpdate / 24))

      for (const key in data.categoryClicks) {
        data.categoryClicks[key] *= decayFactor
        if (data.categoryClicks[key] < 0.1) delete data.categoryClicks[key]
      }

      for (const key in data.tagClicks) {
        data.tagClicks[key] *= decayFactor
        if (data.tagClicks[key] < 0.1) delete data.tagClicks[key]
      }
    }
  },

  trackInteraction(prompt: Prompt) {
    const data = this.getInteractions()
    this.applyDecay(data)

    // Track Category
    data.categoryClicks[prompt.category] = (data.categoryClicks[prompt.category] || 0) + 1

    // Track Tags
    if (prompt.tags) {
      prompt.tags.forEach((tag) => {
        data.tagClicks[tag] = (data.tagClicks[tag] || 0) + 0.5 // Tags weigh less than category
      })
    }

    // Track View History
    if (!data.viewedPrompts.includes(prompt.id)) {
      data.viewedPrompts.push(prompt.id)
      if (data.viewedPrompts.length > 50) data.viewedPrompts.shift()
    }

    this.saveInteractions(data)
  },

  getRecommendations(prompts: Prompt[], limit = 4): Prompt[] {
    const interactions = this.getInteractions()
    this.applyDecay(interactions) // Ensure we use decayed weights

    const categoryWeights = interactions.categoryClicks
    const tagWeights = interactions.tagClicks

    // Calculate score for each prompt
    const scoredPrompts = prompts.map((prompt) => {
      let score = 0

      // 1. Global Heat (Views & Likes)
      const viewsScore = (prompt.views || 0) * 0.05
      const likesScore = (prompt.likes || 0) * 0.5
      score += viewsScore + likesScore

      // 2. Personalization (Category Match)
      const catWeight = categoryWeights[prompt.category] || 0
      score += catWeight * 20

      // 3. Personalization (Tag Match)
      if (prompt.tags) {
        prompt.tags.forEach((tag) => {
          score += (tagWeights[tag] || 0) * 10
        })
      }

      // 4. Freshness (Boost new prompts)
      const daysSinceCreation =
        (Date.now() - new Date(prompt.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceCreation < 7) {
        score += 30 // Significant boost for new content
      } else if (daysSinceCreation < 30) {
        score += 10
      }

      return { ...prompt, score }
    })

    // Sort by score descending
    scoredPrompts.sort((a, b) => b.score - a.score)

    // Diversity Filter: Don't show too many from same category
    const finalPrompts: Prompt[] = []
    const categoryCounts: Record<string, number> = {}

    for (const p of scoredPrompts) {
      if (finalPrompts.length >= limit) break

      const catCount = categoryCounts[p.category] || 0
      if (catCount < 2) {
        // Max 2 per category in top recommendations
        finalPrompts.push(p)
        categoryCounts[p.category] = catCount + 1
      }
    }

    // If we didn't fill the limit (due to diversity), fill with next best
    if (finalPrompts.length < limit) {
      for (const p of scoredPrompts) {
        if (finalPrompts.length >= limit) break
        if (!finalPrompts.find((existing) => existing.id === p.id)) {
          finalPrompts.push(p)
        }
      }
    }

    return finalPrompts
  },
}
