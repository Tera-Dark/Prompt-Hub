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

  private ensureAuth() {
    if (!this.octokit) throw new Error('Not authenticated')
  }

  async getUser() {
    this.ensureAuth()
    const { data } = await this.octokit!.users.getAuthenticated()
    return data
  }

  async getRepoDetails() {
    this.ensureAuth()
    const { data } = await this.octokit!.repos.get({
      owner: this.owner,
      repo: this.repo,
    })
    return data
  }

  async getContents(path: string) {
    this.ensureAuth()
    const { data } = await this.octokit!.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path,
    })
    return data
  }

  async createIssue(title: string, body: string) {
    this.ensureAuth()
    const { data } = await this.octokit!.issues.create({
      owner: this.owner,
      repo: this.repo,
      title,
      body,
    })
    return data.html_url
  }

  async listPullRequests(state: 'open' | 'closed' | 'all' = 'open') {
    this.ensureAuth()
    const { data } = await this.octokit!.pulls.list({
      owner: this.owner,
      repo: this.repo,
      state,
    })
    return data
  }

  async getPullRequest(pullNumber: number) {
    this.ensureAuth()
    const { data } = await this.octokit!.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: pullNumber,
    })
    return data
  }

  async mergePullRequest(pullNumber: number) {
    this.ensureAuth()
    const { data } = await this.octokit!.pulls.merge({
      owner: this.owner,
      repo: this.repo,
      pull_number: pullNumber,
      merge_method: 'squash',
    })
    return data
  }

  async updateIssue(issueNumber: number, state: 'open' | 'closed') {
    this.ensureAuth()
    const { data } = await this.octokit!.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      state,
    })
    return data
  }

  async getRef(ref: string) {
    this.ensureAuth()
    const { data } = await this.octokit!.git.getRef({
      owner: this.owner,
      repo: this.repo,
      ref,
    })
    return data
  }

  async createBlob(content: string, encoding: 'utf-8' | 'base64') {
    this.ensureAuth()
    const { data } = await this.octokit!.git.createBlob({
      owner: this.owner,
      repo: this.repo,
      content,
      encoding,
    })
    return data
  }

  async createTree(
    baseTreeSha: string | undefined,
    tree: {
      path: string
      mode: '100644' | '100755' | '040000' | '160000' | '120000'
      type: 'blob' | 'tree' | 'commit'
      content?: string
      sha?: string
    }[],
  ) {
    this.ensureAuth()
    const { data } = await this.octokit!.git.createTree({
      owner: this.owner,
      repo: this.repo,
      base_tree: baseTreeSha,
      tree,
    })
    return data
  }

  async createCommit(message: string, treeSha: string, parents: string[]) {
    this.ensureAuth()
    const { data } = await this.octokit!.git.createCommit({
      owner: this.owner,
      repo: this.repo,
      message,
      tree: treeSha,
      parents,
    })
    return data
  }

  async updateRef(ref: string, sha: string) {
    this.ensureAuth()
    const { data } = await this.octokit!.git.updateRef({
      owner: this.owner,
      repo: this.repo,
      ref,
      sha,
    })
    return data
  }

  async updateFiles(
    branch: string,
    filesOrUpdater:
      | { path: string; content?: string; sha?: string }[]
      | ((baseSha: string) => Promise<{ path: string; content: string }[]>),
    message: string,
    retries = 3,
  ) {
    this.ensureAuth()

    let lastError: unknown

    for (let i = 0; i < retries; i++) {
      try {
        // 1. Get the current commit of the branch
        const { data: ref } = await this.octokit!.git.getRef({
          owner: this.owner,
          repo: this.repo,
          ref: `heads/${branch}`,
        })
        const currentCommitSha = ref.object.sha

        // 2. Get the tree of the current commit
        const { data: currentCommit } = await this.octokit!.git.getCommit({
          owner: this.owner,
          repo: this.repo,
          commit_sha: currentCommitSha,
        })
        const currentTreeSha = currentCommit.tree.sha

        let filesToUpdate: { path: string; content?: string; sha?: string }[] = []

        if (typeof filesOrUpdater === 'function') {
          const updater = filesOrUpdater as (
            baseSha: string,
          ) => Promise<{ path: string; content: string }[]>
          filesToUpdate = await updater(currentCommitSha)
        } else {
          filesToUpdate = filesOrUpdater
        }

        // 3. Create a new tree with the updated files
        const tree = filesToUpdate.map((file) => ({
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          content: file.content,
          sha: file.sha,
        }))

        const newTree = await this.createTree(currentTreeSha, tree)

        // 4. Create a new commit
        const newCommit = await this.createCommit(message, newTree.sha, [currentCommitSha])

        // 5. Update the branch reference
        await this.updateRef(`heads/${branch}`, newCommit.sha)

        return newCommit
      } catch (error: unknown) {
        lastError = error
        const e = error as { status?: number; message?: string }
        const isFastForwardError =
          e.status === 409 ||
          e.status === 422 ||
          (e.message && e.message.toLowerCase().includes('fast forward'))

        if (!isFastForwardError) {
          throw error
        }

        await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500))
        console.warn(`Retrying updateFiles due to fast-forward error (attempt ${i + 1}/${retries})`)
      }
    }

    throw lastError
  }

  // --- Migrated Standalone Functions ---

  async getDefaultBranch() {
    this.ensureAuth()
    const { data } = await this.octokit!.repos.get({ owner: this.owner, repo: this.repo })
    return data.default_branch
  }

  async getBranchSha(branch: string) {
    this.ensureAuth()
    const { data } = await this.octokit!.repos.getBranch({
      owner: this.owner,
      repo: this.repo,
      branch,
    })
    return data.commit.sha
  }

  async createBranch(branch: string, sha: string) {
    this.ensureAuth()
    await this.octokit!.git.createRef({
      owner: this.owner,
      repo: this.repo,
      ref: `refs/heads/${branch}`,
      sha,
    })
  }

  async getFile(path: string, ref: string) {
    this.ensureAuth()
    const { data } = await this.octokit!.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path,
      ref,
    })
    if (Array.isArray(data) || !('content' in data)) {
      throw new Error('Not a file')
    }
    return {
      content: decodeURIComponent(escape(atob(data.content))),
      sha: data.sha,
    }
  }

  async getRawFile(path: string, branch = 'main') {
    // Try GitHub Pages first (faster, CDN cached)
    // Fallback to raw.githubusercontent.com
    const pagesUrl = `https://${this.owner}.github.io/${this.repo}/${path}`
    const rawUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${branch}/${path}`

    try {
      const response = await fetch(pagesUrl, { cache: 'no-cache' })
      if (response.ok) return await response.text()
      throw new Error('Pages not found')
    } catch {
      const response = await fetch(rawUrl)
      if (!response.ok) throw new Error(`Failed to fetch raw file: ${response.statusText}`)
      return await response.text()
    }
  }

  async updateFile(path: string, content: string, message: string, branch: string, sha: string) {
    this.ensureAuth()
    const base64Content = btoa(unescape(encodeURIComponent(content)))

    const { data } = await this.octokit!.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path,
      message,
      content: base64Content,
      branch,
      sha,
    })
    return data.commit
  }

  async createPullRequest(title: string, head: string, base: string, body: string) {
    this.ensureAuth()
    const { data } = await this.octokit!.pulls.create({
      owner: this.owner,
      repo: this.repo,
      title,
      head,
      base,
      body,
    })
    return data.html_url
  }

  async listIssues(creator?: string) {
    this.ensureAuth()
    // Explicitly define the params type to avoid implicit any if inference fails,
    // or just remove the explicit ': any' and let inference do its job.
    // The previous error was 'Unexpected any. Specify a different type'.
    const params: {
      owner: string
      repo: string
      state: 'open' | 'closed' | 'all'
      creator?: string
    } = {
      owner: this.owner,
      repo: this.repo,
      state: 'open',
    }
    if (creator) {
      params.creator = creator
    }
    const { data } = await this.octokit!.issues.listForRepo(params)
    return data
  }

  async closeIssue(issueNumber: number) {
    this.ensureAuth()
    const { data } = await this.octokit!.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      state: 'closed',
    })
    return data
  }
}

export const githubService = new GitHubService()
