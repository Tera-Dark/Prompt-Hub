import { Octokit } from '@octokit/rest'

export class GitHubService {
  private octokit: Octokit | null = null
  private owner: string
  private repo: string

  constructor() {
    this.owner = import.meta.env.VITE_GITHUB_REPO_OWNER || ''
    this.repo = import.meta.env.VITE_GITHUB_REPO_NAME || ''
  }

  setAccessToken(token: string) {
    this.octokit = new Octokit({ auth: token })
  }

  isAuthenticated(): boolean {
    return !!this.octokit
  }

  async getUser() {
    if (!this.octokit) throw new Error('Not authenticated')
    const { data } = await this.octokit.users.getAuthenticated()
    return data
  }

  async getRepoDetails() {
    if (!this.octokit) throw new Error('Not authenticated')
    const { data } = await this.octokit.repos.get({
      owner: this.owner,
      repo: this.repo,
    })
    return data
  }

  async getContents(path: string) {
    if (!this.octokit) throw new Error('Not authenticated')
    const { data } = await this.octokit.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path,
    })
    return data
  }

  async createIssue(title: string, body: string) {
    if (!this.octokit) throw new Error('Not authenticated')
    const { data } = await this.octokit.issues.create({
      owner: this.owner,
      repo: this.repo,
      title,
      body,
    })
    return data.html_url
  }
}

export const githubService = new GitHubService()

// Standalone functions to support existing repositories
export async function getDefaultBranch(owner: string, repo: string, token: string) {
  const octokit = new Octokit({ auth: token })
  const { data } = await octokit.repos.get({ owner, repo })
  return data.default_branch
}

export async function getBranchSha(owner: string, repo: string, branch: string, token: string) {
  const octokit = new Octokit({ auth: token })
  const { data } = await octokit.repos.getBranch({ owner, repo, branch })
  return data.commit.sha
}

export async function createBranch(
  owner: string,
  repo: string,
  branch: string,
  sha: string,
  token: string,
) {
  const octokit = new Octokit({ auth: token })
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha,
  })
}

export async function getFile(
  owner: string,
  repo: string,
  path: string,
  ref: string,
  token: string,
) {
  const octokit = new Octokit({ auth: token })
  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path,
    ref,
  })
  if (Array.isArray(data) || !('content' in data)) {
    throw new Error('Not a file')
  }
  return {
    content: atob(data.content),
    sha: data.sha,
  }
}

export async function updateFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  sha: string,
  token: string,
) {
  const octokit = new Octokit({ auth: token })
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: content, // Content should already be base64 encoded if it's an image, or we handle encoding before calling
    branch,
    sha,
  })
}

export async function createPullRequest(
  owner: string,
  repo: string,
  title: string,
  head: string,
  base: string,
  body: string,
  token: string,
) {
  const octokit = new Octokit({ auth: token })
  const { data } = await octokit.pulls.create({
    owner,
    repo,
    title,
    head,
    base,
    body,
  })
  return data.html_url
}

export async function createIssue(
  owner: string,
  repo: string,
  title: string,
  body: string,
  token: string,
) {
  const octokit = new Octokit({ auth: token })
  const { data } = await octokit.issues.create({
    owner,
    repo,
    title,
    body,
  })
  return data.html_url
}
