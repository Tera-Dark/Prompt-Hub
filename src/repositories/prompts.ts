import type { Prompt } from '@/types/prompt'
import { getDefaultBranch, getBranchSha, createBranch, getFile, updateFile, createPullRequest } from '@/services/github'

function repoInfo() {
  const owner = import.meta.env.VITE_GITHUB_REPO_OWNER
  const repo = import.meta.env.VITE_GITHUB_REPO_NAME
  if (!owner || !repo) throw new Error('缺少仓库配置')
  return { owner, repo }
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
  await updateFile(owner, repo, 'public/data/prompts.json', JSON.stringify(next, null, 2), message, branch, file.sha, token)
  const prTitle = `Add prompt: ${newItem.title}`
  const prBody = `Add a new prompt in category ${newItem.category}`
  return await createPullRequest(owner, repo, prTitle, branch, base, prBody, token)
}

export async function updatePromptById(id: string, updater: (p: Prompt) => Prompt, token: string): Promise<string> {
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
  await updateFile(owner, repo, 'public/data/prompts.json', JSON.stringify(next, null, 2), message, branch, file.sha, token)
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
  await updateFile(owner, repo, 'public/data/prompts.json', JSON.stringify(next, null, 2), message, branch, file.sha, token)
  const prTitle = `Delete prompt: ${id}`
  const prBody = `Remove prompt ${id}`
  return await createPullRequest(owner, repo, prTitle, branch, base, prBody, token)
}
