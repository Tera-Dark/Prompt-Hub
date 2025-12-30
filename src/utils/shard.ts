/**
 * Shard Storage Utilities
 * 分片存储工具函数
 */

import { githubService } from '@/services/github'

export interface ShardIndex {
  version: string
  shardCount: number
  totalPrompts: number
  lastUpdated: string
  categories: Record<
    string,
    {
      count: number
      shards: number[]
      promptIds: string[]
    }
  >
  shardMap: Record<string, string[]>
}

export interface ShardData {
  shardId: number
  prompts: any[]
}

/**
 * 计算字符串的哈希值
 */
export function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * 根据promptId计算分片ID
 */
export function getShardId(promptId: string, shardCount: number): number {
  return hashCode(promptId) % shardCount
}

/**
 * 加载索引
 */
export async function loadShardIndex(): Promise<ShardIndex> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/prompts/index.json`)
    if (!response.ok) throw new Error('Fetch failed')
    return await response.json()
  } catch (e) {
    // Fallback to raw file (bypass cache or if pages is down)
    const content = await githubService.getRawFile('public/data/prompts/index.json')
    return JSON.parse(content)
  }
}

/**
 * 加载指定分片
 */
export async function loadShard(shardId: number): Promise<ShardData> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/prompts/shard-${shardId}.json`)
    if (!response.ok) throw new Error('Fetch failed')
    return await response.json()
  } catch (e) {
    const content = await githubService.getRawFile(`public/data/prompts/shard-${shardId}.json`)
    return JSON.parse(content)
  }
}

/**
 * 加载多个分片
 */
export async function loadShards(shardIds: number[]): Promise<any[]> {
  const shardPromises = shardIds.map((id) => loadShard(id))
  const shards = await Promise.all(shardPromises)
  return shards.flatMap((shard) => shard.prompts)
}

/**
 * 按分类加载prompts
 */
export async function loadPromptsByCategory(category: string): Promise<any[]> {
  const index = await loadShardIndex()
  const categoryData = index.categories[category]

  if (!categoryData) {
    return []
  }

  const prompts = await loadShards(categoryData.shards)
  return prompts.filter((p) => p.category === category)
}

/**
 * 加载所有prompts (兼容旧API)
 */
export async function loadAllPrompts(): Promise<any[]> {
  const index = await loadShardIndex()
  const allShardIds = Array.from({ length: index.shardCount }, (_, i) => i)
  return await loadShards(allShardIds)
}

/**
 * 按ID查找prompt
 */
export async function findPromptById(promptId: string): Promise<any | null> {
  const index = await loadShardIndex()
  const shardId = getShardId(promptId, index.shardCount)
  const shard = await loadShard(shardId)
  return shard.prompts.find((p) => p.id === promptId) || null
}
