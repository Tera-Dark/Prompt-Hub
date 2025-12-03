import { ref } from 'vue'
import { useToast } from '@/composables/useToast'
import LZString from 'lz-string'

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
  aiPaintingConfig?: {
    baseModel: string
    negativePrompt?: string
    resolution?: string
    steps?: number | null
    cfg?: number | null
    sampler?: string
    seed?: string
    modelHash?: string
  }
}

const DRAFTS_KEY = 'prompt_hub_local_drafts'
const COMPRESSED_PREFIX = 'lz:'

export function useLocalDrafts() {
  const drafts = ref<LocalDraft[]>([])
  const toast = useToast()

  function loadDrafts() {
    try {
      const stored = localStorage.getItem(DRAFTS_KEY)
      if (stored) {
        let parsed: LocalDraft[] = []
        if (stored.startsWith(COMPRESSED_PREFIX)) {
          const compressed = stored.slice(COMPRESSED_PREFIX.length)
          const decompressed = LZString.decompressFromUTF16(compressed)
          if (decompressed) {
            parsed = JSON.parse(decompressed)
          }
        } else {
          // Backward compatibility for uncompressed data
          parsed = JSON.parse(stored)
        }

        drafts.value = parsed
        // Sort by savedAt desc
        drafts.value.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
      }
    } catch (e) {
      console.error('Failed to load drafts', e)
      // If corrupted, maybe clear? For now just log.
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
      const json = JSON.stringify(drafts.value)
      const compressed = COMPRESSED_PREFIX + LZString.compressToUTF16(json)
      localStorage.setItem(DRAFTS_KEY, compressed)
      toast.success('草稿已保存')
      return id
    } catch (e: any) {
      console.error('Failed to save draft', e)
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        toast.error('存储空间已满，请清理旧草稿')
      } else {
        toast.error('保存草稿失败')
      }
      return null
    }
  }

  function deleteDraft(id: string) {
    loadDrafts()
    drafts.value = drafts.value.filter((d) => d.id !== id)
    try {
      const json = JSON.stringify(drafts.value)
      const compressed = COMPRESSED_PREFIX + LZString.compressToUTF16(json)
      localStorage.setItem(DRAFTS_KEY, compressed)
      toast.success('草稿已删除')
    } catch (e) {
      console.error('Failed to delete draft', e)
    }
  }

  function getDraft(id: string) {
    loadDrafts()
    return drafts.value.find((d) => d.id === id)
  }

  function clearAllDrafts() {
    drafts.value = []
    localStorage.removeItem(DRAFTS_KEY)
    toast.success('所有草稿已清空')
  }

  return {
    drafts,
    loadDrafts,
    saveDraft,
    deleteDraft,
    getDraft,
    clearAllDrafts,
  }
}
