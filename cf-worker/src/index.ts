/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Worker: GitHub App OAuth Proxy
 * 
 * Exchanges GitHub OAuth code for user access token.
 * Stores CLIENT_ID and CLIENT_SECRET as Cloudflare Secrets.
 * CORS headers restrict to https://tera-dark.github.io
 */

export interface Env {
  CLIENT_ID: string
  CLIENT_SECRET: string
}

interface ExchangeRequest {
  code?: string
  redirect_uri?: string
}

interface TokenResponse {
  access_token: string
  token_type: string
  scope: string
  expires_in?: number
}

interface ErrorResponse {
  error: string
  error_description?: string
}

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const ALLOWED_ORIGIN = 'https://tera-dark.github.io'

/**
 * Build CORS headers for the response
 * Only allows requests from the specified origin
 */
function buildCorsHeaders(requestOrigin: string | null): Record<string, string> {
  // Only allow the specified origin
  const allowedOrigin = requestOrigin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ALLOWED_ORIGIN

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  }
}

/**
 * Exchange GitHub OAuth code for access token
 */
async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  env: Env,
): Promise<TokenResponse | ErrorResponse> {
  try {
    const response = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.CLIENT_ID,
        client_secret: env.CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    })

    const data = await response.json<Record<string, unknown>>()

    if (!response.ok) {
      return {
        error: (data.error as string) || 'token_exchange_failed',
        error_description: (data.error_description as string) || 'Failed to exchange code for token',
      }
    }

    if (!data.access_token) {
      return {
        error: (data.error as string) || 'missing_access_token',
        error_description: 'GitHub returned no access token',
      }
    }

    return {
      access_token: data.access_token as string,
      token_type: (data.token_type as string) || 'bearer',
      scope: (data.scope as string) || '',
      expires_in: data.expires_in as number | undefined,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      error: 'token_exchange_error',
      error_description: errorMessage,
    }
  }
}

/**
 * Handle preflight requests
 */
function handleOptions(corsHeaders: Record<string, string>): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}

/**
 * Handle POST /exchange requests
 */
async function handleExchange(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  try {
    const body = (await request.json()) as ExchangeRequest

    // Validate required fields
    if (!body.code) {
      return new Response(
        JSON.stringify({
          error: 'missing_code',
          error_description: 'The "code" parameter is required',
        } as ErrorResponse),
        {
          status: 400,
          headers: corsHeaders,
        },
      )
    }

    if (!body.redirect_uri) {
      return new Response(
        JSON.stringify({
          error: 'missing_redirect_uri',
          error_description: 'The "redirect_uri" parameter is required',
        } as ErrorResponse),
        {
          status: 400,
          headers: corsHeaders,
        },
      )
    }

    // Exchange the code for a token
    const tokenResponse = await exchangeCodeForToken(body.code, body.redirect_uri, env)

    if ('error' in tokenResponse) {
      return new Response(JSON.stringify(tokenResponse), {
        status: 400,
        headers: corsHeaders,
      })
    }

    return new Response(JSON.stringify(tokenResponse), {
      status: 200,
      headers: corsHeaders,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({
        error: 'invalid_request',
        error_description: errorMessage,
      } as ErrorResponse),
      {
        status: 400,
        headers: corsHeaders,
      },
    )
  }
}

/**
 * Main worker entry point
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestOrigin = request.headers.get('Origin')
    const corsHeaders = buildCorsHeaders(requestOrigin)

    // Parse the URL
    const url = new URL(request.url)

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions(corsHeaders)
    }

    // Handle exchange endpoint
    if (url.pathname === '/exchange' && request.method === 'POST') {
      return handleExchange(request, env, corsHeaders)
    }

    // Handle other paths/methods
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({
          error: 'method_not_allowed',
          error_description: 'Only POST requests to /exchange are supported',
        } as ErrorResponse),
        {
          status: 405,
          headers: corsHeaders,
        },
      )
    }

    return new Response(
      JSON.stringify({
        error: 'not_found',
        error_description: 'Endpoint not found. Use POST /exchange',
      } as ErrorResponse),
      {
        status: 404,
        headers: corsHeaders,
      },
    )
  },
} satisfies ExportedHandler<Env>
