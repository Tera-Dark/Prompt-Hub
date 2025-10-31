# Cloudflare Worker: GitHub App OAuth Exchange

This guide walks through deploying the lightweight Cloudflare Worker that swaps the OAuth `code` returned by the GitHub App web flow for a short‑lived user access token. The worker keeps the GitHub App OAuth secrets off the client, enforces an origin allowlist, and exposes a single JSON API that the Prompt-Hub frontend can call from static hosting.

## What is included in the repository

- `cloudflare/github-app-oauth-worker/src/worker.ts` – TypeScript source for the worker.
- `cloudflare/github-app-oauth-worker/wrangler.toml` – Minimal Wrangler configuration template.

Copy these files into a new worker project (or point your Wrangler project at them) to deploy the proxy with zero additional dependencies.

## 1. Prepare your GitHub App OAuth credentials

1. Visit **Settings → Developer settings → GitHub Apps → _Your App_**.
2. In the **OAuth** section, copy the **Client ID** and, if needed, generate a new **Client Secret**.
3. Note the OAuth callback URL(s) you configured for the app – the same value must be supplied as `redirect_uri` during the token exchange.

Only OAuth credentials created inside a GitHub App support creating user access tokens for the app. Personal OAuth Apps will not work here.

## 2. Bootstrap the worker project (Wrangler CLI)

```bash
# From the root of this repository
cd cloudflare/github-app-oauth-worker

# Optionally create a fresh directory for deployment
target_dir="../prompt-hub-github-app-oauth"
mkdir -p "$target_dir"
cp -R . "$target_dir"
cd "$target_dir"

# Authenticate with Cloudflare (first run only)
wrangler login
```

The copied folder already contains a TypeScript entry file (`src/worker.ts`) and a starter `wrangler.toml`. Adjust the `name` field in `wrangler.toml` if you want a different worker subdomain.

## 3. Configure secrets and environment values

Store sensitive values as Worker secrets so they are not checked into source control:

```bash
wrangler secret put CLIENT_ID
wrangler secret put CLIENT_SECRET
wrangler secret put ALLOWED_ORIGIN
```

- `CLIENT_ID` / `CLIENT_SECRET` – taken from your GitHub App OAuth configuration.
- `ALLOWED_ORIGIN` – the exact origin (or comma-separated list of origins) that may call this worker, e.g. `https://yourname.github.io` or `http://localhost:5173,https://yourname.github.io` during development.

You can repeat the `wrangler secret put` command whenever a value changes; the next deployment picks it up automatically. If you prefer plain text environment variables, you may set `ALLOWED_ORIGIN` under `[vars]` in `wrangler.toml` instead of storing it as a secret.

## 4. Deploy on the Cloudflare Workers free plan

```bash
wrangler deploy
```

Deployment returns a `https://<worker-name>.<account>.workers.dev` URL. The free plan automatically provisions this workers.dev subdomain and includes 100,000 requests per day, which is plenty for admin sign-ins.

Save the URL. You will export it to the frontend as `VITE_GH_APP_OAUTH_PROXY_URL` (see §7).

## 5. Worker implementation

The worker expects `POST /exchange` with a JSON payload. The complete TypeScript source is reproduced below:

```ts
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
```

### Endpoint contract

**Request:**

```
POST /exchange
Content-Type: application/json
Origin: https://yourname.github.io

{
  "code": "<github-oauth-code>",
  "redirect_uri": "https://yourname.github.io/callback", // optional but recommended
  "state": "<state-from-query>",
  "stateVerifier": "<state-saved-client-side>"
}
```

- `redirect_uri` is required when the GitHub App config lists multiple callback URLs.
- `stateVerifier` (or snake_case `state_verifier`) is optional. When provided, the worker demands that it matches the `state` value. A typical pattern is to put the random state string in `sessionStorage` before redirecting to GitHub, then send both values to the worker after the callback.

**Response:**

```
HTTP/1.1 200 OK
Content-Type: application/json
Access-Control-Allow-Origin: https://yourname.github.io

{
  "access_token": "ghu_xxx",
  "token_type": "bearer",
  "scope": "",
  "expires_in": 28800
}
```

On failure the body contains `error`, `error_description`, and (when available) `error_uri` to bubble up upstream failures.

## 6. Wrangler configuration template

`wrangler.toml` is intentionally minimal – update the worker name or add environments as needed:

```toml
name = "prompt-hub-github-app-oauth"
main = "src/worker.ts"
compatibility_date = "2024-10-31"
workers_dev = true
```

If you manage multiple deployments, add environments such as `[env.production]` with their own `name` overrides.

## 7. Wire the worker into the frontend

Add the Worker URL you received from `wrangler deploy` to your project environment:

```
VITE_GH_APP_OAUTH_PROXY_URL=https://prompt-hub-github-app-oauth.your-account.workers.dev
```

During local development you can place this line inside `.env`. For GitHub Pages deployment, add the same value to the repository secrets or the production `.env` file used by the build system.

When the OAuth callback completes, the frontend should POST to `${VITE_GH_APP_OAUTH_PROXY_URL}/exchange` with the payload described above, then use the returned `access_token` to call GitHub’s GitHub App REST endpoints on behalf of the user.

## 8. Manual testing

```bash
curl -X POST \
  -H "Origin: https://yourname.github.io" \
  -H "Content-Type: application/json" \
  -d '{"code":"<github-code>","redirect_uri":"https://yourname.github.io/callback"}' \
  https://prompt-hub-github-app-oauth.your-account.workers.dev/exchange
```

A valid code yields the JSON payload shown above. A rejected origin, missing fields, or an invalid code returns a descriptive error response.

## 9. Deploying from the Cloudflare dashboard (optional)

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/), choose **Workers** → **Create Worker**.
2. Replace the default script with the TypeScript (or the compiled JavaScript) from `src/worker.ts`.
3. Under **Settings → Variables**, add secrets for `CLIENT_ID`, `CLIENT_SECRET`, and `ALLOWED_ORIGIN`.
4. Deploy. Copy the workers.dev URL into `VITE_GH_APP_OAUTH_PROXY_URL` as described earlier.

With these steps complete, the Prompt-Hub admin console can exchange GitHub App OAuth codes securely while keeping the free Cloudflare Workers tier.
