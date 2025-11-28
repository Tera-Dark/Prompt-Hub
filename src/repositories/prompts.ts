import type { Prompt } from '@/types/prompt'
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
} from '@/services/github'

function repoInfo() {
  const owner = import.meta.env.VITE_GITHUB_REPO_OWNER
  const repo = import.meta.env.VITE_GITHUB_REPO_NAME
  if (!owner || !repo) throw new Error('缺少仓库配置')
  return { owner, repo }
}

import { PromptLoadError, type PromptsData } from '@/types/prompt'

const CACHE_KEY = 'prompts_data'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function loadPrompts(): Promise<PromptsData> {
  try {
    // Try to get from cache
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

    // Try new shard-based loading first
    try {
      const { loadShardIndex, loadShards } = await import('@/utils/shard')
      const index = await loadShardIndex()

      // Load all shards
      const allShardIds = Array.from({ length: index.shardCount }, (_, i) => i)
      const prompts = await loadShards(allShardIds)

      const data: PromptsData = {
        version: index.version,
        prompts,
      }

      // Cache the result
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        }),
      )

      return data
    } catch (shardError) {
      // Fallback to old single-file loading if shard loading fails
      console.warn('Shard loading failed, falling back to single file:', shardError)

      const response = await fetch(`${import.meta.env.BASE_URL}data/prompts.json`)

      if (!response.ok) {
        throw new PromptLoadError(
          `Failed to fetch prompts: ${response.status} ${response.statusText}`,
        )
      }

      const data: PromptsData = await response.json()

      if (!data || !data.prompts || !Array.isArray(data.prompts)) {
        throw new PromptLoadError('Invalid prompts data structure')
      }

      // Cache the result
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        }),
      )

      return data
    }
  } catch (error) {
    console.error('Error loading prompts:', error)
    throw error instanceof PromptLoadError
      ? error
      : new PromptLoadError(error instanceof Error ? error.message : 'Unknown error')
  }
}

export async function addPrompt(
  item: Prompt,
  token: string,
  directCommit = false,
): Promise<string> {
  const { owner, repo } = repoInfo()
  const base = await getDefaultBranch(owner, repo, token)
  const baseSha = await getBranchSha(owner, repo, base, token)

  let branch = base
  if (!directCommit) {
    branch = `prompt-add-${item.id}-${Date.now()}`
    await createBranch(owner, repo, branch, baseSha, token)
  }

  const file = await getFile(owner, repo, 'public/data/prompts.json', base, token)
  const data = JSON.parse(file.content) as { version: string; prompts: Prompt[] }
  const next = { version: data.version, prompts: [item, ...data.prompts] }
  // Fix: GitHub API requires content to be Base64 encoded
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(next, null, 2))))
  const message = `feat: add prompt ${item.title}`

  const commit = await updateFile(
    owner,
    repo,
    'public/data/prompts.json',
    content,
    message,
    branch,
    file.sha,
    token,
  )

  if (directCommit) {
    return commit.html_url!
  }

  const prTitle = `Add prompt: ${item.title}`
  const prBody = `Add prompt ${item.id}`
  return await createPullRequest(owner, repo, prTitle, branch, base, prBody, token)
}

export async function updatePromptById(
  id: string,
  updater: (_p: Prompt) => Prompt,
  token: string,
  directCommit = false,
): Promise<string> {
  const { owner, repo } = repoInfo()
  const base = await getDefaultBranch(owner, repo, token)
  const baseSha = await getBranchSha(owner, repo, base, token)

  let branch = base
  if (!directCommit) {
    branch = `prompt-edit-${id}-${Date.now()}`
    await createBranch(owner, repo, branch, baseSha, token)
  }

  const file = await getFile(owner, repo, 'public/data/prompts.json', base, token)
  const data = JSON.parse(file.content) as { version: string; prompts: Prompt[] }
  const idx = data.prompts.findIndex((x) => x.id === id)
  if (idx < 0) throw new Error('未找到待编辑的提示词')
  const updated = updater(data.prompts[idx])
  const next = { version: data.version, prompts: [...data.prompts] }
  next.prompts[idx] = updated
  const message = `feat: update prompt ${id}`
  // Fix: GitHub API requires content to be Base64 encoded
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(next, null, 2))))

  const commit = await updateFile(
    owner,
    repo,
    'public/data/prompts.json',
    content,
    message,
    branch,
    file.sha,
    token,
  )

  if (directCommit) {
    return commit.html_url!
  }

  const prTitle = `Update prompt: ${updated.title}`
  const prBody = `Update prompt ${updated.id}`
  return await createPullRequest(owner, repo, prTitle, branch, base, prBody, token)
}

export async function deletePromptById(
  id: string,
  token: string,
  directCommit = false,
): Promise<string> {
  const { owner, repo } = repoInfo()
  const base = await getDefaultBranch(owner, repo, token)
  const baseSha = await getBranchSha(owner, repo, base, token)

  let branch = base
  if (!directCommit) {
    branch = `prompt-delete-${id}-${Date.now()}`
    await createBranch(owner, repo, branch, baseSha, token)
  }

  const file = await getFile(owner, repo, 'public/data/prompts.json', base, token)
  const data = JSON.parse(file.content) as { version: string; prompts: Prompt[] }
  const next = { version: data.version, prompts: data.prompts.filter((x) => x.id !== id) }
  // Fix: GitHub API requires content to be Base64 encoded
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(next, null, 2))))
  const message = `feat: delete prompt ${id}`

  const commit = await updateFile(
    owner,
    repo,
    'public/data/prompts.json',
    content,
    message,
    branch,
    file.sha,
    token,
  )

  if (directCommit) {
    return commit.html_url!
  }

  const prTitle = `Delete prompt: ${id}`
  const prBody = `Delete prompt ${id}`
  return await createPullRequest(owner, repo, prTitle, branch, base, prBody, token)
}

export async function submitPromptIssue(newItem: Prompt, token: string): Promise<string> {
  if (token === 'mock-token') {
    throw new Error(
      'Mock login cannot submit to real GitHub. Please sign out and sign in with GitHub.',
    )
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

**Author:** ${newItem.author?.username || 'Anonymous'}
${newItem.author?.avatarUrl ? `**Avatar:** ${newItem.author.avatarUrl}` : ''}

---
*Submitted via Prompt-Hub*
`
  return await createIssue(owner, repo, title, body, token)
}

export async function getUserSubmissions(username: string, token: string): Promise<Prompt[]> {
  const { owner, repo } = repoInfo()
  const issues = await listIssues(owner, repo, username, token)

  return issues.map((issue) => ({
    id: `issue-${issue.number}`,
    title: issue.title.replace('[Submission] ', ''),
    category: 'Pending Review',
    description: 'This prompt is currently under review.',
    prompt: '', // Content is in issue body, difficult to parse perfectly without structure
    tags: [],
    createdAt: issue.created_at,
    status: 'draft',
    author: {
      username: issue.user?.login || username,
      avatarUrl: issue.user?.avatar_url,
    },
    sourceLink: issue.html_url,
  }))
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
  const message = `chore: upload image ${file.name}`

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
}

export async function getPendingSubmissions(token: string): Promise<PendingSubmission[]> {
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
      })
    }
  }

  // Process PRs - only open ones
  for (const pr of prs) {
    // Double-check state is open
    if (pr.state !== 'open') continue

    if (pr.title.startsWith('Add prompt:') || pr.title.startsWith('Update prompt:')) {
      submissions.push({
        id: `pr-${pr.number}`,
        title: pr.title,
        category: 'Pending Merge',
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
      })
    }
  }

  return submissions
}

export async function approveSubmission(
  submission: PendingSubmission,
  token: string,
): Promise<void> {
  const { owner, repo } = repoInfo()

  if (submission.type === 'pr') {
    await mergePullRequest(owner, repo, submission.number, token)
  } else {
    // For Issues, we need to parse the body and add it to the file
    // This is complex because we need to parse the markdown body back to a Prompt object
    // For now, let's assume the body format we created in submitPromptIssue
    const body = submission.prompt
    const titleMatch = body.match(/\*\*Title:\*\* (.*)/)
    const categoryMatch = body.match(/\*\*Category:\*\* (.*)/)
    const descMatch = body.match(/\*\*Description:\*\*\s*\n([\s\S]*?)\n\n\*\*Prompt:\*\*/)
    const promptMatch = body.match(/```\n([\s\S]*?)\n```/)
    const tagsMatch = body.match(/\*\*Tags:\*\* (.*)/)

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
