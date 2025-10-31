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
    throw new Error('GitHub App OAuth can only be used in a browser context.')
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

  const clientId = import.meta.env.VITE_GH_APP_CLIENT_ID
  if (!clientId) {
    throw new Error('Missing GitHub App client id configuration.')
  }

  const redirectUri = buildRedirectUri()

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user',
    state,
    allow_signup: 'false',
  })

  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`
}

type ExchangeResponse = {
  access_token?: string
  token_type?: string
  scope?: string
  expires_in?: number | string
  refresh_token?: string
  refresh_token_expires_in?: number | string
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

function getRequiredEnv(
  name: 'VITE_GITHUB_REPO_OWNER' | 'VITE_GITHUB_REPO_NAME' | 'VITE_GH_APP_OAUTH_PROXY_URL',
) {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Missing required configuration: ${name}`)
  }
  return value
}

function resolveExpiryMs(expiresIn?: number | string) {
  const numericValue =
    typeof expiresIn === 'number'
      ? expiresIn
      : typeof expiresIn === 'string'
        ? Number.parseInt(expiresIn, 10)
        : Number.NaN

  if (Number.isFinite(numericValue) && numericValue > 0) {
    return numericValue * 1000
  }

  return TOKEN_TTL_MS
}

export async function handleCallback(code: string, state: string): Promise<AuthSession> {
  if (!code || !state) {
    throw new Error('Missing OAuth code or state parameter.')
  }

  ensureBrowserContext()
  readOAuthState(state)

  const proxyUrl = stripTrailingSlash(getRequiredEnv('VITE_GH_APP_OAUTH_PROXY_URL'))
  const owner = getRequiredEnv('VITE_GITHUB_REPO_OWNER')
  const repo = getRequiredEnv('VITE_GITHUB_REPO_NAME')
  const redirectUri = buildRedirectUri()

  let exchangePayload: ExchangeResponse
  try {
    const response = await fetch(`${proxyUrl}/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ code, state, redirect_uri: redirectUri }),
      credentials: 'omit',
      mode: 'cors',
    })

    exchangePayload = (await response.json().catch(() => ({}))) as ExchangeResponse

    if (!response.ok || !exchangePayload.access_token) {
      const errorMessage = exchangePayload.error_description || exchangePayload.error || 'Failed to exchange authorization code.'
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

  const collaboratorBaseUrl = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/collaborators/${encodeURIComponent(
    user.login,
  )}`
  const collaboratorResponse = await fetch(`${collaboratorBaseUrl}?permission=push`, {
    method: 'GET',
    headers,
  })

  let hasRepoWriteAccess = false

  if (collaboratorResponse.status === 204) {
    hasRepoWriteAccess = true
  } else if (collaboratorResponse.status === 404) {
    hasRepoWriteAccess = false
  } else if (collaboratorResponse.status === 422) {
    const fallbackResponse = await fetch(`${collaboratorBaseUrl}/permission`, {
      method: 'GET',
      headers,
    })

    if (fallbackResponse.status === 204) {
      hasRepoWriteAccess = true
    } else if (fallbackResponse.status === 404) {
      hasRepoWriteAccess = false
    } else if (fallbackResponse.ok) {
      const fallbackPayload = await fallbackResponse.json().catch(() => null)

      if (fallbackPayload && typeof fallbackPayload === 'object') {
        const fallbackPermission =
          (fallbackPayload as { permission?: string }).permission ??
          (fallbackPayload as { role_name?: string }).role_name ??
          ''
        const normalizedFallbackPermission =
          typeof fallbackPermission === 'string' ? fallbackPermission.toLowerCase() : ''
        hasRepoWriteAccess = ['admin', 'maintain', 'write'].includes(normalizedFallbackPermission)
      } else {
        throw new Error('Unable to verify repository permissions.')
      }
    } else {
      throw new Error('Unable to verify repository permissions.')
    }
  } else if (collaboratorResponse.ok) {
    const collaboratorPayload = await collaboratorResponse.json().catch(() => null)

    if (collaboratorPayload && typeof collaboratorPayload === 'object') {
      const permission =
        (collaboratorPayload as { permission?: string }).permission ??
        (collaboratorPayload as { role_name?: string }).role_name ??
        ''
      const permissionsRecordRaw =
        (collaboratorPayload as { permissions?: Record<string, boolean | undefined> }).permissions

      const normalizedPermission = typeof permission === 'string' ? permission.toLowerCase() : ''
      const directPermission = ['admin', 'maintain', 'write', 'push'].includes(normalizedPermission)

      let derivedPermission = false
      if (permissionsRecordRaw && typeof permissionsRecordRaw === 'object') {
        const permissionsRecord = permissionsRecordRaw as Record<string, boolean | undefined>
        derivedPermission = ['admin', 'maintain', 'push'].some((key) => permissionsRecord[key] === true)
      }

      hasRepoWriteAccess = directPermission || derivedPermission
    } else {
      throw new Error('Unable to verify repository permissions.')
    }
  } else {
    throw new Error('Unable to verify repository permissions.')
  }

  const session: AuthSession = {
    token,
    user,
    hasRepoWriteAccess,
    expiresAt: Date.now() + resolveExpiryMs(exchangePayload.expires_in),
  }

  saveSession(session)
  return session
}
