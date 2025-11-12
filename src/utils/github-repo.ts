const API = 'https://api.github.com'

type RepoInfo = { default_branch: string }

function headers(token: string) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export async function getDefaultBranch(owner: string, repo: string, token: string): Promise<string> {
  const res = await fetch(`${API}/repos/${owner}/${repo}`, { headers: headers(token) })
  const info = (await res.json()) as RepoInfo
  if (!res.ok || !info.default_branch) throw new Error('无法获取仓库默认分支')
  return info.default_branch
}

export async function getBranchSha(owner: string, repo: string, branch: string, token: string): Promise<string> {
  const res = await fetch(`${API}/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, {
    headers: headers(token),
  })
  const data = await res.json()
  const sha = data?.object?.sha || data?.sha
  if (!res.ok || !sha) throw new Error('无法获取分支 SHA')
  return sha
}

export async function createBranch(owner: string, repo: string, newBranch: string, baseSha: string, token: string) {
  const res = await fetch(`${API}/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha: baseSha }),
  })
  if (!res.ok) throw new Error('创建分支失败')
}

export async function getFile(owner: string, repo: string, path: string, ref: string, token: string): Promise<{ sha: string; content: string }> {
  const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`, {
    headers: headers(token),
  })
  const data = await res.json()
  const sha = data?.sha
  const encoded = data?.content
  if (!res.ok || !sha || !encoded) throw new Error('无法读取文件内容')
  const decoded = atob(encoded.replace(/\n/g, ''))
  return { sha, content: decoded }
}

export async function updateFile(owner: string, repo: string, path: string, newContent: string, message: string, branch: string, sha: string, token: string) {
  const encoded = btoa(newContent)
  const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: encoded, branch, sha }),
  })
  if (!res.ok) throw new Error('更新文件失败')
}

export async function createPullRequest(owner: string, repo: string, title: string, head: string, base: string, body: string, token: string) {
  const res = await fetch(`${API}/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, head, base, body }),
  })
  const data = await res.json()
  if (!res.ok || !data?.html_url) throw new Error('创建 Pull Request 失败')
  return data.html_url as string
}
