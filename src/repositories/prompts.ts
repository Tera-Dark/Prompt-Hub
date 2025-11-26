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

    const response = await fetch(`${import.meta.env.BASE_URL}data/prompts.json`)

    if (!response.ok) {
      throw new PromptLoadError(
        `Failed to fetch prompts: ${response.status} ${response.statusText}`,
      )
    }

    const data = await response.json()

    if (!data || typeof data !== 'object') {
      throw new PromptLoadError('Invalid prompts data: expected an object')
    }

    if (!Array.isArray(data.prompts)) {
      throw new PromptLoadError('Invalid prompts data: prompts field must be an array')
    }

    // Save to cache
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        }),
      )
    } catch (e) {
      console.warn('Failed to cache prompts', e)
    }

    return data as PromptsData
  } catch (error) {
    if (error instanceof PromptLoadError) {
      throw error
    }

    if (error instanceof Error) {
      throw new PromptLoadError('Failed to load prompts data', error)
    }

    throw new PromptLoadError('An unknown error occurred while loading prompts')
  }
}

export async function addPrompt(newItem: Prompt, token: string): Promise<string> {
  const { owner, repo } = repoInfo()
  const base = await getDefaultBranch(owner, repo, token)
  const baseSha = await getBranchSha(owner, repo, base, token)
  const branch = `prompt-add-${Date.now()}`
  await createBranch(owner, repo, branch, baseSha, token)
  const file = await getFile(owner, repo, 'public/data/prompts.json', base, token)
  const data = JSON.parse(file.content) as { version: string; prompts: Prompt[] }
  const next = { version: data.version, prompts: [newItem, ...data.prompts] }
  const message = `feat: add prompt ${newItem.id}`
  // Fix: GitHub API requires content to be Base64 encoded
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(next, null, 2))))

  await updateFile(
    owner,
    repo,
    'public/data/prompts.json',
    content,
    message,
    branch,
    file.sha,
    token,
  )
  const prTitle = `Add prompt: ${newItem.title}`
  const prBody = `Add a new prompt in category ${newItem.category}`
  return await createPullRequest(owner, repo, prTitle, branch, base, prBody, token)
}

export async function updatePromptById(
  id: string,
  updater: (_p: Prompt) => Prompt,
  token: string,
): Promise<string> {
  const { owner, repo } = repoInfo()
  const base = await getDefaultBranch(owner, repo, token)
  const baseSha = await getBranchSha(owner, repo, base, token)
  const branch = `prompt-edit-${id}-${Date.now()}`
  await createBranch(owner, repo, branch, baseSha, token)
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

  await updateFile(
    owner,
    repo,
    'public/data/prompts.json',
    content,
    message,
    branch,
    file.sha,
    token,
  )
  const prTitle = `Update prompt: ${updated.title}`
  const prBody = `Update prompt ${updated.id}`
  return await createPullRequest(owner, repo, prTitle, branch, base, prBody, token)
}

export async function deletePromptById(id: string, token: string): Promise<string> {
  const { owner, repo } = repoInfo()
  const base = await getDefaultBranch(owner, repo, token)
  const baseSha = await getBranchSha(owner, repo, base, token)
  const branch = `prompt-delete-${id}-${Date.now()}`
  await createBranch(owner, repo, branch, baseSha, token)
  const file = await getFile(owner, repo, 'public/data/prompts.json', base, token)
  const data = JSON.parse(file.content) as { version: string; prompts: Prompt[] }
  const next = { version: data.version, prompts: data.prompts.filter((x) => x.id !== id) }
  const message = `feat: delete prompt ${id}`
  // Fix: GitHub API requires content to be Base64 encoded
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(next, null, 2))))

  await updateFile(
    owner,
    repo,
    'public/data/prompts.json',
    content,
    message,
    branch,
    file.sha,
    token,
  )
  const prTitle = `Delete prompt: ${id}`
  const prBody = `Remove prompt ${id}`
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

export async function uploadImage(file: File, token: string): Promise<string> {
  const { owner, repo } = repoInfo()
  const base = await getDefaultBranch(owner, repo, token)
  const baseSha = await getBranchSha(owner, repo, base, token)

  // Create a unique filename
  const ext = file.name.split('.').pop() || 'png'
  const filename = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`
  const path = `public/uploads/${filename}`

  // Convert file to base64
  const content = await new Promise<string>((resolve, reject) => {
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

  const branch = `upload-${filename}`
  await createBranch(owner, repo, branch, baseSha, token)

  await updateFile(
    owner,
    repo,
    path,
    content,
    `chore: upload image ${filename}`,
    branch,
    baseSha, // We use baseSha as we are creating a new file
    token,
  )

  // Create PR to merge the image
  // Note: For a real app, we might want to just commit directly if we have permissions,
  // but following the pattern, we create a PR.
  // HOWEVER, for images, we might want to just use the raw URL after merge.
  // Since we are "Serverless", we need the image to be available.
  // If we use PR, the image won't be available until merged.
  // For this demo, let's assume we merge it or just return the blob URL for preview?
  // No, the user wants "upload support".
  // Let's create a PR. The user will see the image after merge.
  // OR, better: if we have write access, we can commit directly to main?
  // The current `updateFile` takes a branch.

  // Let's stick to the PR flow for consistency, but return the "future" URL.
  // The URL will be: https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
  // Or via jsdelivr: https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}

  await createPullRequest(
    owner,
    repo,
    `Upload image: ${filename}`,
    branch,
    base,
    `Upload image ${filename}`,
    token,
  )

  // Return a URL that is accessible (raw from the branch)
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
}
