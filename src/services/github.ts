const API = 'https://api.github.com'

type HeadersInit = Record<string, string>

function baseHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  retries = 2,
): Promise<{ ok: boolean; status: number; data: T }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, init)
    const status = res.status
    const ok = res.ok
    let data: any = null
    try {
      data = await res.json()
    } catch {
      data = null
    }
    if (ok) return { ok, status, data }
    // Simple retry for 5xx
    if (status >= 500 && attempt < retries) {
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
      continue
    }
    return { ok, status, data }
  }
  return { ok: false, status: 0, data: null as any }
}

export async function getDefaultBranch(
  owner: string,
  repo: string,
  token: string,
): Promise<string> {
  const { ok, data } = await fetchJson<{ default_branch?: string }>(
    `${API}/repos/${owner}/${repo}`,
    {
      headers: baseHeaders(token),
    },
  )
  if (!ok || !data?.default_branch) throw new Error('无法获取仓库默认分支')
  return data.default_branch as string
}

export async function getBranchSha(
  owner: string,
  repo: string,
  branch: string,
  token: string,
): Promise<string> {
  const { ok, data } = await fetchJson<any>(
    `${API}/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
    {
      headers: baseHeaders(token),
    },
  )
  const sha = data?.object?.sha || data?.sha
  if (!ok || !sha) throw new Error('无法获取分支 SHA')
  return sha as string
}

export async function createBranch(
  owner: string,
  repo: string,
  newBranch: string,
  baseSha: string,
  token: string,
) {
  const { ok } = await fetchJson(`${API}/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    headers: { ...baseHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha: baseSha }),
  })
  if (!ok) throw new Error('创建分支失败')
}

export async function getFile(
  owner: string,
  repo: string,
  path: string,
  ref: string,
  token: string,
): Promise<{ sha: string; content: string }> {
  const { ok, data } = await fetchJson<any>(
    `${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`,
    {
      headers: baseHeaders(token),
    },
  )
  const sha = data?.sha
  const encoded = data?.content
  if (!ok || !sha || !encoded) throw new Error('无法读取文件内容')
  const decoded = atob(String(encoded).replace(/\n/g, ''))
  return { sha, content: decoded }
}

export async function updateFile(
  owner: string,
  repo: string,
  path: string,
  newContent: string,
  message: string,
  branch: string,
  sha: string,
  token: string,
) {
  const encoded = btoa(newContent)
  const { ok } = await fetchJson(
    `${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    {
      method: 'PUT',
      headers: { ...baseHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content: encoded, branch, sha }),
    },
  )
  if (!ok) throw new Error('更新文件失败')
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
  const { ok, data } = await fetchJson<any>(`${API}/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers: { ...baseHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, head, base, body }),
  })
  if (!ok || !data?.html_url) throw new Error('创建 Pull Request 失败')
  return data.html_url as string
}
