import { ref } from 'vue'
import { useToast } from '@/composables/useToast'

export interface LocalDraft {
  id: string
  title: string
  category: string
  description: string
  prompt: string
  tags: string
  status: string
  imageUrl: string
  savedAt: string
  images?: string[]
}

const DRAFTS_KEY = 'prompt_hub_local_drafts'

export function useLocalDrafts() {
  const drafts = ref<LocalDraft[]>([])
  const toast = useToast()

  function loadDrafts() {
    try {
      const stored = localStorage.getItem(DRAFTS_KEY)
      if (stored) {
        drafts.value = JSON.parse(stored)
        // Sort by savedAt desc
        drafts.value.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
      }
    } catch (e) {
      console.error('Failed to load drafts', e)
    }
  }

  function saveDraft(draft: Omit<LocalDraft, 'id' | 'savedAt'> & { id?: string }) {
    loadDrafts()

    const now = new Date().toISOString()
    const id = draft.id || `draft-${Date.now()}`

    const newDraft: LocalDraft = {
      ...draft,
      id,
      savedAt: now,
    }

    const index = drafts.value.findIndex((d) => d.id === id)
    if (index >= 0) {
      drafts.value[index] = newDraft
    } else {
      drafts.value.unshift(newDraft)
    }

    try {
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.value))
      toast.success('草稿已保存')
      return id
    } catch (e) {
      console.error('Failed to save draft', e)
      toast.error('保存草稿失败')
      return null
    }
  }

  function deleteDraft(id: string) {
    loadDrafts()
    drafts.value = drafts.value.filter((d) => d.id !== id)
    try {
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.value))
      toast.success('草稿已删除')
    } catch (e) {
      console.error('Failed to delete draft', e)
    }
  }

  function getDraft(id: string) {
    loadDrafts()
    return drafts.value.find((d) => d.id === id)
  }

  return {
    drafts,
    loadDrafts,
    saveDraft,
    deleteDraft,
    getDraft,
  }
}
