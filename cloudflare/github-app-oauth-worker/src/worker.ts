const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

export interface Env {
  CLIENT_ID: string
  CLIENT_SECRET: string
  ALLOWED_ORIGIN?: string
}

type ExchangeRequestBody = {
  code?: unknown
  redirect_uri?: unknown
  state?: unknown
  state_verifier?: unknown
  stateVerifier?: unknown
}

type GitHubAccessTokenSuccess = {
  access_token: string
  token_type?: string
  scope?: string
  expires_in?: number
}

type GitHubAccessTokenError = {
  error?: string
  error_description?: string
  error_uri?: string
}

type GitHubAccessTokenResponse = GitHubAccessTokenSuccess & GitHubAccessTokenError

function parseAllowedOrigins(input?: string) {
  if (!input) {
    return [] as string[]
  }

  return input
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

function isOriginAllowed(origin: string | null, allowlist: string[]) {
  if (!allowlist.length) {
    return true
  }

  if (allowlist.includes('*')) {
    return true
  }

  if (origin === null) {
    return allowlist.includes('null')
  }

  return allowlist.includes(origin)
}

function selectCorsOrigin(origin: string | null, allowlist: string[]) {
  if (!allowlist.length) {
    return origin ?? '*'
  }

  if (allowlist.includes('*')) {
    return origin ?? '*'
  }

  if (origin === null && allowlist.includes('null')) {
    return 'null'
  }

  if (origin !== null && allowlist.includes(origin)) {
    return origin
  }

  return allowlist[0] ?? '*'
}

function buildCorsHeaders(origin: string | null, allowlist: string[]) {
  return {
    'Access-Control-Allow-Origin': selectCorsOrigin(origin, allowlist),
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  }
}

function jsonResponse(body: unknown, init: { status?: number; headers: Record<string, string> }) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...init.headers,
    },
  })
}

function parseRequestBody(body: ExchangeRequestBody) {
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  const redirectUri = typeof body.redirect_uri === 'string' ? body.redirect_uri.trim() : undefined
  const state = typeof body.state === 'string' ? body.state : undefined
  const stateVerifierRaw =
    typeof body.state_verifier === 'string'
      ? body.state_verifier
      : typeof body.stateVerifier === 'string'
        ? body.stateVerifier
        : undefined
  const stateVerifier = stateVerifierRaw?.trim() || undefined

  return { code, redirectUri, state, stateVerifier }
}

async function exchangeCodeForToken(
  payload: { code: string; redirectUri?: string; state?: string },
  env: Env,
): Promise<GitHubAccessTokenSuccess | GitHubAccessTokenError> {
  const requestBody: Record<string, string> = {
    client_id: env.CLIENT_ID,
    client_secret: env.CLIENT_SECRET,
    code: payload.code,
  }

  if (payload.redirectUri) {
    requestBody.redirect_uri = payload.redirectUri
  }

  if (payload.state) {
    requestBody.state = payload.state
  }

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  const json = (await response.json()) as GitHubAccessTokenResponse

  if (!response.ok || 'error' in json) {
    return {
      error: json.error || 'token_exchange_failed',
      error_description: json.error_description,
      error_uri: json.error_uri,
    }
  }

  return {
    access_token: json.access_token,
    token_type: json.token_type ?? 'bearer',
    scope: json.scope ?? '',
    expires_in: json.expires_in,
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')
    const allowlist = parseAllowedOrigins(env.ALLOWED_ORIGIN)
    const corsHeaders = buildCorsHeaders(origin, allowlist)

    if (!isOriginAllowed(origin, allowlist)) {
      return jsonResponse({ error: 'origin_not_allowed' }, { status: 403, headers: corsHeaders })
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'method_not_allowed' }, { status: 405, headers: corsHeaders })
    }

    let body: ExchangeRequestBody

    try {
      body = (await request.json()) as ExchangeRequestBody
    } catch (error) {
      return jsonResponse({ error: 'invalid_json' }, { status: 400, headers: corsHeaders })
    }

    const { code, redirectUri, state, stateVerifier } = parseRequestBody(body)

    if (!code) {
      return jsonResponse({ error: 'missing_code' }, { status: 400, headers: corsHeaders })
    }

    if (stateVerifier !== undefined) {
      if (!state) {
        return jsonResponse({ error: 'missing_state' }, { status: 400, headers: corsHeaders })
      }

      if (stateVerifier !== state) {
        return jsonResponse({ error: 'state_mismatch' }, { status: 400, headers: corsHeaders })
      }
    }

    try {
      const tokenPayload = await exchangeCodeForToken({ code, redirectUri, state }, env)

      if ('error' in tokenPayload) {
        return jsonResponse(tokenPayload, { status: 400, headers: corsHeaders })
      }

      return jsonResponse(tokenPayload, { headers: corsHeaders })
    } catch (error) {
      return jsonResponse({ error: 'token_exchange_failed' }, { status: 502, headers: corsHeaders })
    }
  },
}
