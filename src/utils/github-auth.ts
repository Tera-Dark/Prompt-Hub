const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_API_BASE_URL = 'https://api.github.com'
const TOKEN_STORAGE_KEY = 'prompt-hub::github-auth-session'
const STATE_STORAGE_KEY = 'prompt-hub::github-oauth-state'
const OBFUSCATION_SALT = 'prompt-hub::oauth@2024'
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8 // 8 hours
const STATE_TTL_MS = 1000 * 60 * 10 // 10 minutes

export type GitHubUser = {
  login: string
  name: string | null
  avatar_url: string | null
  html_url: string
  [key: string]: unknown
}

export type AuthSession = {
  token: string
  user: GitHubUser
  hasRepoWriteAccess: boolean
  expiresAt: number
}

type OAuthStatePayload = {
  value: string
  createdAt: number
}

function ensureBrowserContext() {
  if (typeof window === 'undefined') {
    throw new Error('GitHub OAuth can only be used in a browser context.')
  }
}

function reverseString(value: string) {
  return value.split('').reverse().join('')
}

function toBase64(value: string) {
  if (typeof window === 'undefined') {
    throw new Error('Base64 helpers require a browser context.')
  }

  const encoder = new TextEncoder()
  const bytes = encoder.encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function fromBase64(value: string) {
  try {
    if (typeof window === 'undefined') {
      throw new Error('Base64 helpers require a browser context.')
    }

    const binary = atob(value)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch (error) {
    throw new Error('Failed to decode stored authentication payload.')
  }
}

function obfuscate(value: string) {
  const salted = `${OBFUSCATION_SALT}:${value}`
  const reversed = reverseString(salted)
  return toBase64(reversed)
}

function deobfuscate(value: string) {
  try {
    const reversed = fromBase64(value)
    const restored = reverseString(reversed)

    if (!restored.startsWith(`${OBFUSCATION_SALT}:`)) {
      return null
    }

    return restored.slice(OBFUSCATION_SALT.length + 1)
  } catch (error) {
    return null
  }
}

function saveSession(session: AuthSession) {
  ensureBrowserContext()
  const encoded = obfuscate(JSON.stringify(session))
  window.localStorage.setItem(TOKEN_STORAGE_KEY, encoded)
}

export function logout() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  window.sessionStorage.removeItem(STATE_STORAGE_KEY)
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!raw) {
    return null
  }

  const decoded = deobfuscate(raw)
  if (!decoded) {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    return null
  }

  try {
    const session = JSON.parse(decoded) as AuthSession

    if (!session.token || !session.user || typeof session.expiresAt !== 'number') {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
      return null
    }

    if (session.expiresAt <= Date.now()) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
      return null
    }

    return session
  } catch (error) {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    return null
  }
}

function stripTrailingSlash(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

function buildRedirectUri() {
  ensureBrowserContext()
  const baseUrl = import.meta.env.BASE_URL ?? '/'
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  return `${window.location.origin}${normalizedBase}/auth/callback`
}

export function createOAuthState() {
  ensureBrowserContext()
  const buffer = new Uint8Array(16)
  window.crypto.getRandomValues(buffer)
  const state = Array.from(buffer)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  const payload: OAuthStatePayload = {
    value: state,
    createdAt: Date.now(),
  }

  window.sessionStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(payload))
  return state
}

export function getAuthUrl(state: string) {
  ensureBrowserContext()

  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
  if (!clientId) {
    throw new Error('Missing GitHub OAuth client id configuration.')
  }

  const redirectUri = buildRedirectUri()

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo',
    allow_signup: 'false',
    state,
  })

  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`
}

type ExchangeResponse = {
  access_token?: string
  token_type?: string
  scope?: string
  error?: string
  error_description?: string
}

function readOAuthState(state: string) {
  ensureBrowserContext()

  const raw = window.sessionStorage.getItem(STATE_STORAGE_KEY)
  if (!raw) {
    throw new Error('Authentication session expired. Please start the login flow again.')
  }

  try {
    const payload = JSON.parse(raw) as OAuthStatePayload

    if (!payload.value || payload.value !== state) {
      window.sessionStorage.removeItem(STATE_STORAGE_KEY)
      throw new Error('Login state mismatch. Please try signing in again.')
    }

    if (Date.now() - payload.createdAt > STATE_TTL_MS) {
      window.sessionStorage.removeItem(STATE_STORAGE_KEY)
      throw new Error('Login session timed out. Please try signing in again.')
    }

    window.sessionStorage.removeItem(STATE_STORAGE_KEY)
  } catch (error) {
    window.sessionStorage.removeItem(STATE_STORAGE_KEY)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Unable to validate login state. Please try again.')
  }
}

function buildAuthHeaders(token: string) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function getRequiredEnv(name: 'VITE_GITHUB_REPO_OWNER' | 'VITE_GITHUB_REPO_NAME') {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Missing required configuration: ${name}`)
  }
  return value
}

export async function handleCallback(code: string, state: string): Promise<AuthSession> {
  if (!code || !state) {
    throw new Error('Missing OAuth code or state parameter.')
  }

  ensureBrowserContext()
  readOAuthState(state)

  // 如果配置了完整的 URL 则使用配置的，否则默认使用同域下的 /api
  const configuredProxyUrl = import.meta.env.VITE_OAUTH_PROXY_URL
  const proxyUrl = configuredProxyUrl ? stripTrailingSlash(configuredProxyUrl) : '/api'
  const owner = getRequiredEnv('VITE_GITHUB_REPO_OWNER')
  const repo = getRequiredEnv('VITE_GITHUB_REPO_NAME')

  let exchangePayload: ExchangeResponse
  try {
    const response = await fetch(`${proxyUrl}/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        code,
        redirect_uri: buildRedirectUri(),
      }),
      credentials: 'omit',
      mode: 'cors',
    })

    exchangePayload = (await response.json().catch(() => ({}))) as ExchangeResponse

    if (!response.ok || !exchangePayload.access_token) {
      const errorMessage =
        exchangePayload.error_description ||
        exchangePayload.error ||
        'Failed to exchange authorization code.'
      throw new Error(errorMessage)
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OAuth exchange failed: ${error.message}`)
    }
    throw new Error('OAuth exchange failed due to an unknown error.')
  }

  const token = exchangePayload.access_token!

  const headers = buildAuthHeaders(token)

  const userResponse = await fetch(`${GITHUB_API_BASE_URL}/user`, {
    method: 'GET',
    headers,
  })

  if (!userResponse.ok) {
    logout()
    throw new Error('Failed to load GitHub user profile.')
  }

  const user = (await userResponse.json()) as GitHubUser

  const repoUrl = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}`
  const repoResponse = await fetch(repoUrl, {
    method: 'GET',
    headers,
  })

  let hasRepoWriteAccess = false

  if (repoResponse.ok) {
    const repoData = (await repoResponse.json()) as {
      permissions?: { admin: boolean; push: boolean; maintain?: boolean }
    }
    const permissions = repoData.permissions
    if (permissions) {
      hasRepoWriteAccess = permissions.admin || permissions.push || !!permissions.maintain
    }
  } else {
    console.error(
      `Repo check failed: ${repoResponse.status} ${repoResponse.statusText} for URL: ${repoUrl}`,
    )
    // 如果是 404 或 403，可能意味着用户没有权限查看该仓库，或者仓库不存在
    // 在这种情况下，我们默认没有写入权限，而不是直接抛出错误，除非是其他严重错误
    if (repoResponse.status !== 404 && repoResponse.status !== 403) {
      throw new Error(`Unable to verify repository permissions. (Status: ${repoResponse.status})`)
    }
  }

  const session: AuthSession = {
    token,
    user,
    hasRepoWriteAccess,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  }

  saveSession(session)
  return session
}

export function mockLogin(): AuthSession {
  const session: AuthSession = {
    token: 'mock-token',
    user: {
      login: 'dev-user',
      name: 'Developer',
      avatar_url: null,
      html_url: 'https://github.com',
    },
    hasRepoWriteAccess: true,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  }
  saveSession(session)
  return session
}
