import { githubService, getDefaultBranch } from './github'

function repoInfo() {
  const owner = import.meta.env.VITE_GITHUB_REPO_OWNER
  const repo = import.meta.env.VITE_GITHUB_REPO_NAME
  if (!owner || !repo) throw new Error('Repository configuration missing')
  return { owner, repo }
}

export async function uploadImage(file: File, token: string): Promise<string> {
  githubService.setAccessToken(token)
  const { owner, repo } = repoInfo()

  // Get default branch dynamically
  const branch = await getDefaultBranch(owner, repo, token)

  // 1. Read file as Base64
  const base64Content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = (error) => reject(error)
  })

  // 2. Create Blob
  const blobData = await githubService.createBlob(base64Content, 'base64')

  // 3. Generate Path
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const timestamp = now.getTime()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = file.name.split('.').pop() || 'png'
  const path = `public/data/images/${year}/${month}/${timestamp}-${random}.${ext}`

  // 4. Commit File
  await githubService.updateFiles(
    branch,
    [{ path, sha: blobData.sha }],
    `chore: upload image ${path}`,
  )

  // 5. Return URL
  // Using jsdelivr for better CDN performance and correct MIME types
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path}`
}
