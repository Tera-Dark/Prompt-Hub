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

  async listPullRequests(state: 'open' | 'closed' | 'all' = 'open') {
    if (!this.octokit) throw new Error('Not authenticated')
    const { data } = await this.octokit.pulls.list({
      owner: this.owner,
      repo: this.repo,
      state,
    })
    return data
  }

  async mergePullRequest(pullNumber: number) {
    if (!this.octokit) throw new Error('Not authenticated')
    const { data } = await this.octokit.pulls.merge({
      owner: this.owner,
      repo: this.repo,
      pull_number: pullNumber,
      merge_method: 'squash',
    })
    return data
  }

  async updateIssue(issueNumber: number, state: 'open' | 'closed') {
    if (!this.octokit) throw new Error('Not authenticated')
    const { data } = await this.octokit.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      state,
    })
    return data
  }
  async getRef(ref: string) {
    if (!this.octokit) throw new Error('Not authenticated')
    const { data } = await this.octokit.git.getRef({
      owner: this.owner,
      repo: this.repo,
      ref,
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
    if (!this.octokit) throw new Error('Not authenticated')
    const { data } = await this.octokit.git.createTree({
      owner: this.owner,
      repo: this.repo,
      base_tree: baseTreeSha,
      tree,
    })
    return data
  }

  async createCommit(message: string, treeSha: string, parents: string[]) {
    if (!this.octokit) throw new Error('Not authenticated')
    const { data } = await this.octokit.git.createCommit({
      owner: this.owner,
      repo: this.repo,
      message,
      tree: treeSha,
      parents,
    })
    return data
  }

  async updateRef(ref: string, sha: string) {
    if (!this.octokit) throw new Error('Not authenticated')
    const { data } = await this.octokit.git.updateRef({
      owner: this.owner,
      repo: this.repo,
      ref,
      sha,
    })
    return data
  }

  async updateFiles(branch: string, files: { path: string; content: string }[], message: string) {
    if (!this.octokit) throw new Error('Not authenticated')

    // 1. Get the current commit of the branch
    const ref = await this.getRef(`heads/${branch}`)
    const currentCommitSha = ref.object.sha

    // 2. Get the tree of the current commit
    const { data: currentCommit } = await this.octokit.git.getCommit({
      owner: this.owner,
      repo: this.repo,
      commit_sha: currentCommitSha,
    })
    const currentTreeSha = currentCommit.tree.sha

    // 3. Create a new tree with the updated files
    const tree = files.map((file) => ({
      path: file.path,
      mode: '100644' as const,
      type: 'blob' as const,
      content: file.content,
    }))

    const newTree = await this.createTree(currentTreeSha, tree)

    // 4. Create a new commit
    const newCommit = await this.createCommit(message, newTree.sha, [currentCommitSha])

    // 5. Update the branch reference
    await this.updateRef(`heads/${branch}`, newCommit.sha)

    return newCommit
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
  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: content, // Content should already be base64 encoded if it's an image, or we handle encoding before calling
    branch,
    sha,
  })
  return data.commit
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

export async function listIssues(owner: string, repo: string, creator: string, token: string) {
  const octokit = new Octokit({ auth: token })
  const { data } = await octokit.issues.listForRepo({
    owner,
    repo,
    creator,
    state: 'open',
  })
  return data
}

export async function listPullRequests(owner: string, repo: string, token: string) {
  const octokit = new Octokit({ auth: token })
  const { data } = await octokit.pulls.list({
    owner,
    repo,
    state: 'open',
  })
  return data
}

export async function mergePullRequest(
  owner: string,
  repo: string,
  pullNumber: number,
  token: string,
) {
  const octokit = new Octokit({ auth: token })
  const { data } = await octokit.pulls.merge({
    owner,
    repo,
    pull_number: pullNumber,
    merge_method: 'squash',
  })
  return data
}

export async function closeIssue(owner: string, repo: string, issueNumber: number, token: string) {
  const octokit = new Octokit({ auth: token })
  const { data } = await octokit.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    state: 'closed',
  })
  return data
}
