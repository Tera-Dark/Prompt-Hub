import type { Prompt } from '@/types/prompt'
export type { Prompt }
import {
  getDefaultBranch,
  getBranchSha,
  createBranch,
  getFile,
  updateFile,
  createPullRequest,
  createIssue,
  listIssues,
  listPullRequests,
  mergePullRequest,
  closeIssue,
  githubService,
} from '@/services/github'
import {
  getShardId,
  loadShardIndex,
  loadShards,
  type ShardIndex,
  type ShardData,
} from '@/utils/shard'

import i18n from '@/i18n'

function repoInfo() {
  const owner = import.meta.env.VITE_GITHUB_REPO_OWNER
  const repo = import.meta.env.VITE_GITHUB_REPO_NAME
  if (!owner || !repo) throw new Error(i18n.global.t('errors.repoConfigMissing'))
  return { owner, repo }
}

import { PromptLoadError, type PromptsData } from '@/types/prompt'

const CACHE_KEY = 'prompts_data_v3' // Bump version for sharding
const CACHE_TTL = 60 * 1000 // 1 minute

export async function loadPrompts(force = false): Promise<PromptsData> {
  try {
    // Try to get from cache
    if (!force) {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < CACHE_TTL) {
            return data as PromptsData
          }
        } catch (e) {
          console.warn('Failed to parse cached prompts', e)
          localStorage.removeItem(CACHE_KEY)
        }
      }
    }

    // Load from shards
    try {
      const index = await loadShardIndex()
      const allShardIds = Array.from({ length: index.shardCount }, (_, i) => i)
      const prompts = await loadShards(allShardIds)

      const data: PromptsData = {
        version: index.version,
        prompts,
      }

      // Cache the result
      setPromptsCache(data)

      return data
    } catch (error) {
      // Fallback to prompts.json if shards fail (during migration or error)
      console.warn('Shard loading failed, trying prompts.json', error)
      const response = await fetch(`${import.meta.env.BASE_URL}data/prompts.json`)
      if (!response.ok) throw error
      return await response.json()
    }
  } catch (error) {
    console.error('Error loading prompts:', error)
    throw error instanceof PromptLoadError
      ? error
      : new PromptLoadError(error instanceof Error ? error.message : 'Unknown error')
  }
}

export function clearPromptsCache() {
  localStorage.removeItem(CACHE_KEY)
}

export function setPromptsCache(data: PromptsData) {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      data,
      timestamp: Date.now(),
    }),
  )
}

export async function addPrompt(
  item: Prompt,
  token: string,
  directCommit = false,
): Promise<string> {
  const { owner, repo } = repoInfo()
  githubService.setAccessToken(token)

  const base = await getDefaultBranch(owner, repo, token)

  let branch = base
  if (!directCommit) {
    branch = `prompt-add-${item.id}-${Date.now()}`
    const baseSha = await getBranchSha(owner, repo, base, token)
    await createBranch(owner, repo, branch, baseSha, token)
  }

  const message = `feat: add prompt ${item.id}`

  // Use atomic updater for both direct commits and PRs to avoid fast-forward errors
  await githubService.updateFiles(
    branch,
    async (baseSha) => {
      // 1. Fetch fresh Index
      const indexFile = await getFile(owner, repo, 'public/data/prompts/index.json', baseSha, token)
      let index: ShardIndex
      try {
        index = JSON.parse(indexFile.content) as ShardIndex
      } catch {
        // Fallback if empty/corrupt
        index = {
          version: '2.0.0',
          shardCount: 8,
          totalPrompts: 0,
          lastUpdated: new Date().toISOString(),
          categories: {},
          shardMap: {},
        }
      }

      const shardId = getShardId(item.id, index.shardCount)

      // 2. Fetch fresh Shard
      const shardFile = await getFile(
        owner,
        repo,
        `public/data/prompts/shard-${shardId}.json`,
        baseSha,
        token,
      )
      const shard = JSON.parse(shardFile.content) as ShardData

      // 3. Update Data
      shard.prompts.unshift(item)

      // Update Index Logic
      const category = item.category
      if (!index.categories[category]) {
        index.categories[category] = { count: 0, shards: [], promptIds: [] }
      }
      index.categories[category].count++
      index.categories[category].promptIds.push(item.id)
      if (!index.categories[category].shards.includes(shardId)) {
        index.categories[category].shards.push(shardId)
      }

      if (!index.shardMap[shardId]) index.shardMap[shardId] = []
      index.shardMap[shardId].push(item.id)
      index.totalPrompts++
      index.lastUpdated = new Date().toISOString()

      // 4. Return files to update
      return [
        {
          path: 'public/data/prompts/index.json',
          content: JSON.stringify(index, null, 2),
        },
        {
          path: `public/data/prompts/shard-${shardId}.json`,
          content: JSON.stringify(shard, null, 2),
        },
      ]
    },
    message,
  )

  if (directCommit) {
    // Optimistic Cache Update
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data } = JSON.parse(cached)
      data.prompts.unshift(item)
      setPromptsCache(data)
    }

    return `https://github.com/${owner}/${repo}`
  }

  // For PR, create the pull request

  const prTitle = `Add prompt: ${item.title}`
  // CRITICAL FIX: PR body must contain structured data for review parsing
  const prBody = `
### New Prompt Submission

**Title:** ${item.title}
**Category:** ${item.category}
**Description:**
${item.description}

**Prompt:**
\`\`\`
${item.prompt}
\`\`\`

**Tags:** ${item.tags.join(', ')}
**Images:** ${JSON.stringify(item.images || (item.imageUrl ? [item.imageUrl] : []))}
**Status:** ${item.status}

**Author:** ${item.author?.username || 'Anonymous'}
${item.author?.avatarUrl ? `**Avatar:** ${item.author.avatarUrl}` : ''}

<!-- METADATA_JSON_START
${JSON.stringify(item)}
METADATA_JSON_END -->
`
  return await createPullRequest(owner, repo, prTitle, branch, base, prBody, token)
}

export async function updatePromptById(
  id: string,
  updater: (_p: Prompt) => Prompt,
  token: string,
  directCommit = false,
): Promise<string> {
  const { owner, repo } = repoInfo()
  githubService.setAccessToken(token)
  const base = await getDefaultBranch(owner, repo, token)

  let branch = base
  if (!directCommit) {
    branch = `prompt-edit-${id}-${Date.now()}`
    const baseSha = await getBranchSha(owner, repo, base, token)
    await createBranch(owner, repo, branch, baseSha, token)
  }

  const message = `feat: update prompt`

  // Use atomic updater for both direct commits and PRs
  await githubService.updateFiles(
    branch,
    async (baseSha) => {
      // 1. Fetch Index
      const indexFile = await getFile(owner, repo, 'public/data/prompts/index.json', baseSha, token)
      let index: ShardIndex
      try {
        index = JSON.parse(indexFile.content) as ShardIndex
      } catch {
        index = {
          version: '2.0.0',
          shardCount: 8,
          totalPrompts: 0,
          lastUpdated: new Date().toISOString(),
          categories: {},
          shardMap: {},
        }
      }

      const shardId = getShardId(id, index.shardCount)

      // 2. Fetch Shard
      const shardFile = await getFile(
        owner,
        repo,
        `public/data/prompts/shard-${shardId}.json`,
        baseSha,
        token,
      )
      const shard = JSON.parse(shardFile.content) as ShardData

      const idx = shard.prompts.findIndex((x: Prompt) => x.id === id)
      if (idx < 0) throw new Error('未找到待编辑的提示词')

      const oldItem = shard.prompts[idx]
      const updated = updater(oldItem)
      shard.prompts[idx] = updated

      // 3. Update Index if category changed
      if (oldItem.category !== updated.category) {
        const oldCat = index.categories[oldItem.category]
        if (oldCat) {
          oldCat.count--
          oldCat.promptIds = oldCat.promptIds.filter((pid) => pid !== id)
        }

        const newCatName = updated.category
        if (!index.categories[newCatName]) {
          index.categories[newCatName] = { count: 0, shards: [], promptIds: [] }
        }
        const newCat = index.categories[newCatName]
        newCat.count++
        newCat.promptIds.push(id)
        if (!newCat.shards.includes(shardId)) {
          newCat.shards.push(shardId)
        }
      }

      index.lastUpdated = new Date().toISOString()

      return [
        {
          path: `public/data/prompts/shard-${shardId}.json`,
          content: JSON.stringify(shard, null, 2),
        },
        {
          path: 'public/data/prompts/index.json',
          content: JSON.stringify(index, null, 2),
        },
      ]
    },
    message,
  )

  if (directCommit) {
    // Optimistic Cache Update
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data } = JSON.parse(cached)
      const cacheIdx = data.prompts.findIndex((p: Prompt) => p.id === id)
      if (cacheIdx >= 0) {
        data.prompts[cacheIdx] = updater(data.prompts[cacheIdx])
        setPromptsCache(data)
      }
    }

    return `https://github.com/${owner}/${repo}`
  }

  // For PR, we need to get the updated item for the PR body
  // Re-fetch to get the updated item
  const indexFile = await getFile(owner, repo, 'public/data/prompts/index.json', branch, token)
  const index = JSON.parse(indexFile.content) as ShardIndex
  const shardId = getShardId(id, index.shardCount)
  const shardFile = await getFile(
    owner,
    repo,
    `public/data/prompts/shard-${shardId}.json`,
    branch,
    token,
  )
  const shard = JSON.parse(shardFile.content) as ShardData
  const updated = shard.prompts.find((p: Prompt) => p.id === id)!

  const prTitle = `Update prompt: ${updated.title}`
  // CRITICAL FIX: PR body must contain structured data for review parsing
  const prBody = `
### Update Prompt Request

**Original ID:** ${id}
**Title:** ${updated.title}
**Category:** ${updated.category}
**Description:**
${updated.description}

**Prompt:**
\`\`\`
${updated.prompt}
\`\`\`

**Tags:** ${updated.tags.join(', ')}
**Images:** ${JSON.stringify(updated.images || (updated.imageUrl ? [updated.imageUrl] : []))}
**Status:** ${updated.status}

**Author:** ${updated.author?.username || 'Anonymous'}

<!-- METADATA_JSON_START
${JSON.stringify(updated)}
METADATA_JSON_END -->
`
  return await createPullRequest(owner, repo, prTitle, branch, base, prBody, token)
}

export async function deletePromptById(
  id: string,
  token: string,
  directCommit = false,
): Promise<string> {
  const { owner, repo } = repoInfo()
  githubService.setAccessToken(token)
  const base = await getDefaultBranch(owner, repo, token)

  let branch = base
  if (!directCommit) {
    branch = `prompt-delete-${id}-${Date.now()}`
    const baseSha = await getBranchSha(owner, repo, base, token)
    await createBranch(owner, repo, branch, baseSha, token)
  }

  const message = `feat: delete prompt`

  // Use atomic updater for both direct commits and PRs
  await githubService.updateFiles(
    branch,
    async (baseSha) => {
      // 1. Fetch Index
      const indexFile = await getFile(owner, repo, 'public/data/prompts/index.json', baseSha, token)
      let index: ShardIndex
      try {
        index = JSON.parse(indexFile.content) as ShardIndex
      } catch {
        index = {
          version: '2.0.0',
          shardCount: 8,
          totalPrompts: 0,
          lastUpdated: new Date().toISOString(),
          categories: {},
          shardMap: {},
        }
      }

      const shardId = getShardId(id, index.shardCount)

      // 2. Fetch Shard
      const shardFile = await getFile(
        owner,
        repo,
        `public/data/prompts/shard-${shardId}.json`,
        baseSha,
        token,
      )
      const shard = JSON.parse(shardFile.content) as ShardData

      const idx = shard.prompts.findIndex((x: Prompt) => x.id === id)
      if (idx < 0) {
        throw new Error('未找到待删除的提示词,可能已被删除或位于其他分片')
      }

      const item = shard.prompts[idx]
      shard.prompts.splice(idx, 1)

      // 3. Update Index
      const cat = index.categories[item.category]
      if (cat) {
        cat.count--
        cat.promptIds = cat.promptIds.filter((pid) => pid !== id)
      }

      const shardMapEntry = index.shardMap[shardId]
      if (shardMapEntry) {
        index.shardMap[shardId] = shardMapEntry.filter((pid) => pid !== id)
      }
      index.totalPrompts--
      index.lastUpdated = new Date().toISOString()

      return [
        {
          path: `public/data/prompts/shard-${shardId}.json`,
          content: JSON.stringify(shard, null, 2),
        },
        {
          path: 'public/data/prompts/index.json',
          content: JSON.stringify(index, null, 2),
        },
      ]
    },
    message,
  )

  if (directCommit) {
    // Optimistic Cache Update
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data } = JSON.parse(cached)
      data.prompts = data.prompts.filter((p: Prompt) => p.id !== id)
      setPromptsCache(data)
    }

    return `https://github.com/${owner}/${repo}`
  }

  const prTitle = `Delete prompt: ${id}`
  const prBody = `Delete prompt ${id}`
  return await createPullRequest(owner, repo, prTitle, branch, base, prBody, token)
}

export async function submitPromptIssue(newItem: Prompt, token: string): Promise<string> {
  if (token === 'mock-token') {
    throw new Error(i18n.global.t('errors.mockLoginSubmit'))
  }
  const { owner, repo } = repoInfo()
  const title = `[Submission] ${newItem.title}`
  const body = `
### New Prompt Submission

**Title:** ${newItem.title}
**Category:** ${newItem.category}
**Description:**
${newItem.description}

**Prompt:**
\`\`\`
${newItem.prompt}
\`\`\`

**Tags:** ${newItem.tags.join(', ')}
**Images:** ${JSON.stringify(newItem.images || (newItem.imageUrl ? [newItem.imageUrl] : []))}
**Status:** ${newItem.status}

**Author:** ${newItem.author?.username || 'Anonymous'}
${newItem.author?.avatarUrl ? `**Avatar:** ${newItem.author.avatarUrl}` : ''}

<!-- METADATA_JSON_START
${JSON.stringify(newItem)}
METADATA_JSON_END -->

---
*Submitted via Prompt-Hub*
`
  return await createIssue(owner, repo, title, body, token)
}

export async function submitPromptUpdate(
  originalId: string,
  updatedItem: Prompt,
  token: string,
): Promise<string> {
  if (token === 'mock-token') {
    throw new Error(i18n.global.t('errors.mockLoginSubmit'))
  }
  const { owner, repo } = repoInfo()
  const title = `[Update] ${originalId}`
  const body = `
### Update Prompt Request

**Original ID:** ${originalId}
**Title:** ${updatedItem.title}
**Category:** ${updatedItem.category}
**Description:**
${updatedItem.description}

**Prompt:**
\`\`\`
${updatedItem.prompt}
\`\`\`

**Tags:** ${updatedItem.tags.join(', ')}
**Images:** ${JSON.stringify(updatedItem.images || (updatedItem.imageUrl ? [updatedItem.imageUrl] : []))}
**Status:** ${updatedItem.status}

**Author:** ${updatedItem.author?.username || 'Anonymous'}

<!-- METADATA_JSON_START
${JSON.stringify(updatedItem)}
METADATA_JSON_END -->

---
*Submitted via Prompt-Hub*
`
  return await createIssue(owner, repo, title, body, token)
}

export async function deletePromptsBatch(
  ids: string[],
  token: string,
  directCommit = false,
): Promise<string> {
  const { owner, repo } = repoInfo()
  githubService.setAccessToken(token)
  const base = await getDefaultBranch(owner, repo, token)

  // 1. Prepare Branch
  let branch = base
  if (!directCommit) {
    branch = `batch-delete-${Date.now()}`
    const baseSha = await getBranchSha(owner, repo, base, token)
    await createBranch(owner, repo, branch, baseSha, token)
  }

  const message = `feat: batch delete ${ids.length} prompts`

  // 2. Atomic Update
  if (directCommit) {
    await githubService.updateFiles(
      branch,
      async (baseSha) => {
        // A. Fetch Index
        const indexFile = await getFile(
          owner,
          repo,
          'public/data/prompts/index.json',
          baseSha,
          token,
        )
        let index: ShardIndex
        try {
          index = JSON.parse(indexFile.content) as ShardIndex
        } catch {
          // Should not happen, but fail safe
          throw new Error(i18n.global.t('errors.indexCorrupted'))
        }

        // B. Identify Shards to Fetch
        const shardsToFetch = new Set<number>()

        ids.forEach((id) => {
          const shardId = getShardId(id, index.shardCount)
          shardsToFetch.add(shardId)
        })

        // C. Fetch Shards
        const shardFiles = await Promise.all(
          Array.from(shardsToFetch).map((shardId) =>
            getFile(owner, repo, `public/data/prompts/shard-${shardId}.json`, baseSha, token).then(
              (f) => ({ shardId, content: f.content }),
            ),
          ),
        )

        const shardsMap = new Map<number, ShardData>()
        shardFiles.forEach(({ shardId, content }) => {
          shardsMap.set(shardId, JSON.parse(content) as ShardData)
        })

        // D. Perform Deletions
        let deletedCount = 0

        ids.forEach((id) => {
          const shardId = getShardId(id, index.shardCount)
          const shard = shardsMap.get(shardId)
          if (!shard) return // Should not happen

          const idx = shard.prompts.findIndex((p) => p.id === id)
          if (idx !== -1) {
            const item = shard.prompts[idx]
            shard.prompts.splice(idx, 1)
            deletedCount++

            // Update Index Stats
            const cat = index.categories[item.category]
            if (cat) {
              cat.count--
              cat.promptIds = cat.promptIds.filter((pid) => pid !== id)
            }

            const shardMapEntry = index.shardMap[shardId]
            if (shardMapEntry) {
              index.shardMap[shardId] = shardMapEntry.filter((pid) => pid !== id)
            }
          }
        })

        index.totalPrompts -= deletedCount
        index.lastUpdated = new Date().toISOString()

        // E. Prepare Files for Commit
        const filesToUpdate = [
          {
            path: 'public/data/prompts/index.json',
            content: JSON.stringify(index, null, 2),
          },
        ]

        shardsMap.forEach((shard, shardId) => {
          filesToUpdate.push({
            path: `public/data/prompts/shard-${shardId}.json`,
            content: JSON.stringify(shard, null, 2),
          })
        })

        return filesToUpdate
      },
      message,
    )

    // Optimistic Cache Update
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data } = JSON.parse(cached)
      const idsSet = new Set(ids)
      data.prompts = data.prompts.filter((p: Prompt) => !idsSet.has(p.id))
      setPromptsCache(data)
    }

    return `https://github.com/${owner}/${repo}`
  }

  // Non-direct commit (PR flow) - simplified for now:
  // We can't easily do multi-file PRs without creating the branch first (which we did above)
  // AND updating the files on that branch.
  // So we reuse the logic but targeting the new branch.
  // HOWEVER, updateFiles with function updater works on the branch tip.
  // So we can just call the same logic but with directCommit=true effectively on the feature branch.
  // Wait, the logic above uses `branch` variable.
  // So if we are here, we already created `branch`.
  // We just need to execute the update on `branch`.

  // Actually, the code block above is inside `if (directCommit)`.
  // We should extract the updater logic to be reusable or just duplicate it for now since the flow is slightly different?
  // No, `updateFiles` handles it.
  // If `directCommit` is false, we created a branch. We should run the SAME update logic on that branch.
  // The only difference is the return value (PR URL vs Repo URL).

  // Let's refactor slightly to avoid duplication.
  // But for now, to ensure correctness, I will copy the updater logic.

  await githubService.updateFiles(
    branch,
    async (baseSha) => {
      // A. Fetch Index
      const indexFile = await getFile(owner, repo, 'public/data/prompts/index.json', baseSha, token)
      let index: ShardIndex
      try {
        index = JSON.parse(indexFile.content) as ShardIndex
      } catch {
        throw new Error(i18n.global.t('errors.indexCorrupted'))
      }

      // B. Identify Shards
      const shardsToFetch = new Set<number>()
      ids.forEach((id) => {
        const shardId = getShardId(id, index.shardCount)
        shardsToFetch.add(shardId)
      })

      // C. Fetch Shards
      const shardFiles = await Promise.all(
        Array.from(shardsToFetch).map((shardId) =>
          getFile(owner, repo, `public/data/prompts/shard-${shardId}.json`, baseSha, token).then(
            (f) => ({ shardId, content: f.content }),
          ),
        ),
      )

      const shardsMap = new Map<number, ShardData>()
      shardFiles.forEach(({ shardId, content }) => {
        shardsMap.set(shardId, JSON.parse(content) as ShardData)
      })

      // D. Perform Deletions
      let deletedCount = 0
      ids.forEach((id) => {
        const shardId = getShardId(id, index.shardCount)
        const shard = shardsMap.get(shardId)
        if (!shard) return

        const idx = shard.prompts.findIndex((p) => p.id === id)
        if (idx !== -1) {
          const item = shard.prompts[idx]
          shard.prompts.splice(idx, 1)
          deletedCount++

          // Update Index Stats
          const cat = index.categories[item.category]
          if (cat) {
            cat.count--
            cat.promptIds = cat.promptIds.filter((pid) => pid !== id)
          }

          const shardMapEntry = index.shardMap[shardId]
          if (shardMapEntry) {
            index.shardMap[shardId] = shardMapEntry.filter((pid) => pid !== id)
          }
        }
      })

      index.totalPrompts -= deletedCount
      index.lastUpdated = new Date().toISOString()

      // E. Prepare Files
      const filesToUpdate = [
        {
          path: 'public/data/prompts/index.json',
          content: JSON.stringify(index, null, 2),
        },
      ]

      shardsMap.forEach((shard, shardId) => {
        filesToUpdate.push({
          path: `public/data/prompts/shard-${shardId}.json`,
          content: JSON.stringify(shard, null, 2),
        })
      })

      return filesToUpdate
    },
    message,
  )

  const prTitle = `Batch delete ${ids.length} prompts`
  const prBody = `Batch delete request for prompts:\n\n${ids.map((id) => `- ${id}`).join('\n')}`
  return await createPullRequest(owner, repo, prTitle, branch, base, prBody, token)
}

export async function submitPromptDeleteBatch(ids: string[], token: string): Promise<string> {
  if (token === 'mock-token') {
    throw new Error(i18n.global.t('errors.mockLoginSubmit'))
  }
  const { owner, repo } = repoInfo()
  const title = `[Batch Delete] ${ids.length} prompts`
  const body = `
### Batch Delete Prompt Request

**IDs:**
${ids.map((id) => `- ${id}`).join('\n')}

---
*Submitted via Prompt-Hub*
`
  return await createIssue(owner, repo, title, body, token)
}

export async function submitPromptDelete(id: string, token: string): Promise<string> {
  if (token === 'mock-token') {
    throw new Error(i18n.global.t('errors.mockLoginSubmit'))
  }
  const { owner, repo } = repoInfo()
  const title = `[Delete] ${id}`
  const body = `
### Delete Prompt Request

**ID:** ${id}

---
*Submitted via Prompt-Hub*
`
  return await createIssue(owner, repo, title, body, token)
}

export async function withdrawSubmission(issueNumber: number, token: string): Promise<void> {
  const { owner, repo } = repoInfo()
  await closeIssue(owner, repo, issueNumber, token)
}

export async function getUserSubmissions(
  username: string,
  token: string,
): Promise<PendingSubmission[]> {
  const { owner, repo } = repoInfo()
  const issues = await listIssues(owner, repo, username, token)

  return issues.map((issue) => {
    let action: PendingSubmission['action'] = 'create'
    let originalId: string | undefined
    let title = issue.title

    if (issue.title.includes('[Submission]')) {
      title = issue.title.replace('[Submission] ', '')
    } else if (issue.title.includes('[Update]')) {
      action = 'update'
      originalId = issue.title.replace('[Update] ', '').trim()
      title = `Update: ${originalId}`
    } else if (issue.title.includes('[Delete]')) {
      action = 'delete'
      originalId = issue.title.replace('[Delete] ', '').trim()
      title = `Delete: ${originalId}`
    }

    return {
      id: `issue-${issue.number}`,
      title,
      category: 'Pending Review',
      description: 'This prompt is currently under review.',
      prompt: issue.body || '',
      tags: [],
      createdAt: issue.created_at,
      status: 'draft',
      author: {
        username: issue.user?.login || username,
        avatarUrl: issue.user?.avatar_url,
      },
      sourceLink: issue.html_url,
      type: 'issue',
      number: issue.number,
      action,
      originalId,
    }
  })
}

export async function getAllPendingSubmissions(token: string): Promise<number> {
  const { owner, repo } = repoInfo()
  const issues = await listIssues(owner, repo, undefined, token)
  // Filter for actual submissions if needed, e.g. check title or labels
  // For now assume all open issues are submissions or relevant
  return issues.filter((i) => i.title.includes('[Submission]')).length
}

// Helper to convert File to Base64 string
async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function uploadImage(
  file: File,
  token: string,
  directCommit = false,
): Promise<string> {
  const { owner, repo } = repoInfo()
  const base = await getDefaultBranch(owner, repo, token)
  const baseSha = await getBranchSha(owner, repo, base, token)

  let branch = base
  if (!directCommit) {
    branch = `upload-image-${Date.now()}`
    await createBranch(owner, repo, branch, baseSha, token)
  }

  const path = `public/images/${Date.now()}-${file.name}`
  const content = await fileToBase64(file)
  const message = `chore: upload image`

  await updateFile(
    owner,
    repo,
    path,
    content,
    message,
    branch,
    baseSha, // We use baseSha as we are creating a new file
    token,
  )

  if (directCommit) {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
  }

  const prTitle = `Upload image: ${file.name}`
  const prBody = `Upload image ${file.name}`
  await createPullRequest(owner, repo, prTitle, branch, base, prBody, token)

  // Return a URL that is accessible (raw from the branch)
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
}

export interface PendingSubmission extends Prompt {
  type: 'pr' | 'issue'
  number: number
  action?: 'create' | 'update' | 'delete'
  originalId?: string
}

export async function fetchPendingSubmissions(token: string): Promise<PendingSubmission[]> {
  const { owner, repo } = repoInfo()
  const [issues, prs] = await Promise.all([
    listIssues(owner, repo, '', token),
    listPullRequests(owner, repo, token),
  ])

  const submissions: PendingSubmission[] = []

  // Process Issues - only open ones
  for (const issue of issues) {
    // Double-check state is open
    if (issue.state !== 'open') continue

    if (issue.title.includes('[Submission]')) {
      submissions.push({
        id: `issue-${issue.number}`,
        title: issue.title.replace('[Submission] ', ''),
        category: 'Pending Review',
        description: 'User submission via Issue',
        prompt: issue.body || '',
        tags: [],
        createdAt: issue.created_at,
        status: 'draft',
        author: {
          username: issue.user?.login || 'Anonymous',
          avatarUrl: issue.user?.avatar_url,
        },
        type: 'issue',
        number: issue.number,
        sourceLink: issue.html_url,
        action: 'create',
      })
    } else if (issue.title.includes('[Update]')) {
      const originalId = issue.title.replace('[Update] ', '').trim()
      submissions.push({
        id: `issue-${issue.number}`,
        title: `Update: ${originalId}`,
        category: 'Pending Update',
        description: 'User update request via Issue',
        prompt: issue.body || '',
        tags: [],
        createdAt: issue.created_at,
        status: 'draft',
        author: {
          username: issue.user?.login || 'Anonymous',
          avatarUrl: issue.user?.avatar_url,
        },
        type: 'issue',
        number: issue.number,
        sourceLink: issue.html_url,
        action: 'update',
        originalId,
      })
    } else if (issue.title.includes('[Delete]')) {
      const originalId = issue.title.replace('[Delete] ', '').trim()
      submissions.push({
        id: `issue-${issue.number}`,
        title: `Delete: ${originalId}`,
        category: 'Pending Delete',
        description: 'User delete request via Issue',
        prompt: '',
        tags: [],
        createdAt: issue.created_at,
        status: 'draft',
        author: {
          username: issue.user?.login || 'Anonymous',
          avatarUrl: issue.user?.avatar_url,
        },
        type: 'issue',
        number: issue.number,
        sourceLink: issue.html_url,
        action: 'delete',
        originalId,
      })
    }
  }

  // Process PRs - only open ones
  for (const pr of prs) {
    // Double-check state is open
    if (pr.state !== 'open') continue

    if (pr.title.startsWith('Add prompt:') || pr.title.startsWith('Update prompt:')) {
      // CRITICAL FIX: PR description parsing with fallback
      // Try to extract JSON metadata first
      const metadataMatch = pr.body?.match(
        /<!-- METADATA_JSON_START\s*([\s\S]*?)\s*METADATA_JSON_END -->/,
      )

      if (metadataMatch && metadataMatch[1]) {
        try {
          // We just store the whole body in prompt field as per current architecture
          // AdminReviewView will parse it.
          // But if body is empty/simple, AdminReviewView fails.
          // We need to ensure 'prompt' field here contains the RICH BODY.
        } catch (e) {
          console.warn('Failed to parse PR metadata', e)
        }
      }

      submissions.push({
        id: `pr-${pr.number}`,
        title: pr.title,
        category: 'Pending Merge',
        description: 'Pull Request', // Use simple description for list view
        prompt: pr.body || '', // PASS THE FULL PR BODY HERE. AdminReviewView parses this.
        tags: [],
        createdAt: pr.created_at,
        status: 'draft',
        author: {
          username: pr.user?.login || 'Anonymous',
          avatarUrl: pr.user?.avatar_url,
        },
        type: 'pr',
        number: pr.number,
        sourceLink: pr.html_url,
        action: pr.title.startsWith('Update prompt:') ? 'update' : 'create',
        originalId: pr.title.startsWith('Update prompt:')
          ? pr.body?.match(/\*\*Original ID:\*\*\s*(.*)/i)?.[1]?.trim() || undefined
          : undefined,
      })
    } else if (pr.title.startsWith('Delete prompt:')) {
      submissions.push({
        id: `pr-${pr.number}`,
        title: pr.title,
        category: 'Pending Delete',
        description: pr.body || 'Pull Request',
        prompt: '',
        tags: [],
        createdAt: pr.created_at,
        status: 'draft',
        author: {
          username: pr.user?.login || 'Anonymous',
          avatarUrl: pr.user?.avatar_url,
        },
        type: 'pr',
        number: pr.number,
        sourceLink: pr.html_url,
        action: 'delete',
        originalId: pr.title.replace('Delete prompt: ', '').trim(), // Add this line to fix missing originalId for PRs
      })
    }
  }

  return submissions
}

// Alias for backward compatibility if needed internally, but export is renamed
export const getPendingSubmissions = fetchPendingSubmissions

export async function approveSubmission(
  submission: PendingSubmission,
  token: string,
): Promise<void> {
  const { owner, repo } = repoInfo()

  if (submission.type === 'pr') {
    await mergePullRequest(owner, repo, submission.number, token)
    clearPromptsCache() // Clear cache after merge
  } else {
    // For Issues, we need to parse the body and add/update/delete
    if (submission.action === 'delete') {
      if (!submission.originalId) throw new Error('Missing original ID for delete')
      await deletePromptById(submission.originalId, token, true) // Direct commit as admin
      await closeIssue(owner, repo, submission.number, token)
      return
    }

    const body = submission.prompt

    if (submission.action === 'update') {
      if (!submission.originalId) throw new Error('Missing original ID for update')

      const titleMatch = body.match(/\*\*Title:\*\* (.*)/)
      const categoryMatch = body.match(/\*\*Category:\*\* (.*)/)
      const descMatch = body.match(/\*\*Description:\*\*\s*\n([\s\S]*?)\n\n\*\*Prompt:\*\*/)
      const promptMatch = body.match(/```\n([\s\S]*?)\n```/)
      const tagsMatch = body.match(/\*\*Tags:\*\* (.*)/)
      const statusMatch = body.match(/\*\*Status:\*\* (.*)/)
      const imagesMatch = body.match(/\*\*Images:\*\* (.*)/)

      let images: string[] = []
      if (imagesMatch) {
        try {
          images = JSON.parse(imagesMatch[1].trim())
        } catch {
          images = imagesMatch[1]
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        }
      }

      if (!titleMatch || !categoryMatch || !promptMatch) {
        throw new Error('Failed to parse issue body. Please merge manually.')
      }

      await updatePromptById(
        submission.originalId,
        (orig) => ({
          ...orig,
          title: titleMatch[1].trim(),
          category: categoryMatch[1].trim(),
          description: descMatch ? descMatch[1].trim() : '',
          prompt: promptMatch[1].trim(),
          tags: tagsMatch ? tagsMatch[1].split(',').map((s) => s.trim()) : [],
          updatedAt: new Date().toISOString(),
          status: (statusMatch ? statusMatch[1].trim() : 'published') as Prompt['status'],
          images: images.length > 0 ? images : undefined,
          imageUrl: images.length > 0 ? images[0] : undefined,
        }),
        token,
        true,
      ) // Direct commit as admin

      await closeIssue(owner, repo, submission.number, token)
      return
    }

    // Create (existing logic)
    const titleMatch = body.match(/\*\*Title:\*\* (.*)/)
    const categoryMatch = body.match(/\*\*Category:\*\* (.*)/)
    const descMatch = body.match(/\*\*Description:\*\*\s*\n([\s\S]*?)\n\n\*\*Prompt:\*\*/)
    const promptMatch = body.match(/```\n([\s\S]*?)\n```/)
    const tagsMatch = body.match(/\*\*Tags:\*\* (.*)/)
    const imagesMatch = body.match(/\*\*Images:\*\* (.*)/)

    let images: string[] = []
    if (imagesMatch) {
      try {
        images = JSON.parse(imagesMatch[1].trim())
      } catch {
        images = imagesMatch[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      }
    }

    if (!titleMatch || !categoryMatch || !promptMatch) {
      throw new Error('Failed to parse issue body. Please merge manually.')
    }

    const newItem: Prompt = {
      id: `prompt-${Date.now()}`, // Generate a new ID
      title: titleMatch[1].trim(),
      category: categoryMatch[1].trim(),
      description: descMatch ? descMatch[1].trim() : '',
      prompt: promptMatch[1].trim(),
      tags: tagsMatch ? tagsMatch[1].split(',').map((s) => s.trim()) : [],
      createdAt: new Date().toISOString(),
      status: 'published',
      author: submission.author,
      images: images.length > 0 ? images : undefined,
      imageUrl: images.length > 0 ? images[0] : undefined,
    }

    await addPrompt(newItem, token, true)
    await closeIssue(owner, repo, submission.number, token)
  }
}

export async function rejectSubmission(
  submission: PendingSubmission,
  token: string,
): Promise<void> {
  const { owner, repo } = repoInfo()
  await closeIssue(owner, repo, submission.number, token) // Works for PRs too as they are issues
}
