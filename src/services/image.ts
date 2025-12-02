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

export async function uploadToImgur(file: File): Promise<string> {
  // Fallback Client IDs to try if one fails
  const clientIds = [
    import.meta.env.VITE_IMGUR_CLIENT_ID,
    'e08d9e36853650d', // Public demo ID 1
    '546c25a59c58ad7', // Public demo ID 2
  ].filter(Boolean)

  const base64Content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = (error) => reject(error)
  })

  let lastError: any

  for (const clientId of clientIds) {
    try {
      console.log(`Trying Imgur upload with Client ID: ${clientId?.substring(0, 5)}...`)

      const response = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
          Authorization: `Client-ID ${clientId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Content,
          type: 'base64',
        }),
      })

      const data = await response.json()

      if (!data.success) {
        console.warn('Imgur upload failed for ID:', clientId, data)
        throw new Error(data.data.error || 'Imgur upload failed')
      }

      console.log('✅ Imgur upload success:', data.data.link)
      return data.data.link
    } catch (e) {
      lastError = e
      continue // Try next ID
    }
  }

  throw lastError || new Error('All Imgur upload attempts failed')
}
