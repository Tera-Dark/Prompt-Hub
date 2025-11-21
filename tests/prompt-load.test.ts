import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadPrompts, PromptLoadError } from '@/types/prompt'

describe('loadPrompts', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('loads valid prompts data', async () => {
    const mock = { version: '1.0.0', prompts: [] }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => mock } as any)
    const data = await loadPrompts()
    expect(data.version).toBe('1.0.0')
    expect(Array.isArray(data.prompts)).toBe(true)
  })

  it('throws PromptLoadError on invalid data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({}) } as any)
    await expect(loadPrompts()).rejects.toBeInstanceOf(PromptLoadError)
  })
})
