import { githubService } from './github'

function repoInfo() {
  const owner = import.meta.env.VITE_GITHUB_REPO_OWNER
  const repo = import.meta.env.VITE_GITHUB_REPO_NAME
  if (!owner || !repo) throw new Error('Repository configuration missing')
  return { owner, repo }
}

/**
 * Upload image to GitHub Repository
 * Requires write access token
 */
export async function uploadImage(file: File, token: string): Promise<string> {
  githubService.setAccessToken(token)
  const { owner, repo } = repoInfo()

  // Get default branch dynamically
  const branch = await githubService.getDefaultBranch()

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

// --- External Hosting Services ---

/**
 * Upload to Catbox.moe (Primary)
 * Max size: 200MB
 * Retention: Permanent
 * Note: Uses corsproxy.io to bypass CORS restrictions
 */
async function uploadToCatbox(file: File): Promise<string> {
  console.log('🚀 Trying upload to Catbox.moe...')
  const formData = new FormData()
  formData.append('reqtype', 'fileupload')
  formData.append('fileToUpload', file, file.name) // Explicit filename

  try {
    // Use CORS proxy because Catbox doesn't support CORS
    const response = await fetch('https://corsproxy.io/?https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Catbox upload failed: ${response.status} ${response.statusText}`)
    }

    const url = await response.text()
    if (!url.startsWith('http')) {
      throw new Error('Invalid response from Catbox')
    }
    console.log('✅ Catbox upload success:', url)
    return url
  } catch (e) {
    console.warn('⚠️ Catbox upload failed:', e)
    throw e
  }
}

/**
 * Upload to Telegra.ph (Secondary)
 * Max size: ~5MB
 * Retention: Unlimited (theoretically)
 */
async function uploadToTelegraph(file: File): Promise<string> {
  console.log('🚀 Trying upload to Telegra.ph...')
  const formData = new FormData()
  formData.append('file', file, file.name) // Explicit filename

  try {
    const response = await fetch('https://telegra.ph/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Telegraph upload failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    // Response format: [{"src":"\/file\/xxx.jpg"}]
    if (Array.isArray(data) && data[0] && data[0].src) {
      const url = 'https://telegra.ph' + data[0].src
      console.log('✅ Telegraph upload success:', url)
      return url
    } else {
      throw new Error('Invalid response from Telegraph: ' + JSON.stringify(data))
    }
  } catch (e) {
    console.warn('⚠️ Telegraph upload failed:', e)
    throw e
  }
}

/**
 * Upload to Imgur (Backup)
 * Max size: 10MB (Anon)
 */
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
      console.log(`🚀 Trying Imgur upload with Client ID: ${clientId?.substring(0, 5)}...`)

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
        console.warn('⚠️ Imgur upload failed for ID:', clientId, data)
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

/**
 * Unified External Upload Strategy
 * Order: Catbox -> Telegraph -> Imgur
 */
export async function uploadExternal(file: File): Promise<string> {
  const errors: string[] = []

  // 1. Try Catbox (Best for devs, permanent)
  try {
    return await uploadToCatbox(file)
  } catch (e) {
    errors.push(`Catbox: ${e instanceof Error ? e.message : String(e)}`)
  }

  // 2. Try Telegraph (Fast, free)
  try {
    return await uploadToTelegraph(file)
  } catch (e) {
    errors.push(`Telegraph: ${e instanceof Error ? e.message : String(e)}`)
  }

  // 3. Try Imgur (Backup)
  try {
    return await uploadToImgur(file)
  } catch (e) {
    errors.push(`Imgur: ${e instanceof Error ? e.message : String(e)}`)
  }

  // If all failed
  console.error('❌ All external upload services failed:', errors)
  throw new Error('所有图床上传均失败，请稍后重试或联系管理员。\n' + errors.join('\n'))
}

// Export legacy name for compatibility
export { uploadExternal as uploadToImgurFallback }
