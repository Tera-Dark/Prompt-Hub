# Cloudflare Worker OAuth Proxy

This document explains how to run the tiny Cloudflare Worker that exchanges GitHub OAuth codes for access tokens. The worker keeps your `client_secret` on the serverless edge and exposes a single endpoint that the Vite frontend can call from GitHub Pages or any other static host.

## 1. Worker responsibilities

- Accept a `POST /exchange` request with a JSON body `{ "code": "..." }`
- Forward the OAuth code to GitHub's `/login/oauth/access_token` endpoint along with the app's client id and secret (stored as Worker secrets)
- Return the resulting `access_token` to the browser as JSON
- Reply to pre-flight (`OPTIONS`) requests and emit CORS headers for the site origin

A TypeScript version of the worker is already provided in `document/ADMIN_SYSTEM.md`. Save it as `src/worker.ts` (or `worker.ts`) in your Worker project.

```ts
export interface Env {
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  ALLOWED_ORIGIN?: string
}

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

function resolveAllowedOrigin(requestOrigin: string | null, allowed?: string) {
  if (!allowed) {
    return requestOrigin ?? '*'
  }

  const entries = allowed
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (requestOrigin && entries.includes(requestOrigin)) {
    return requestOrigin
  }

  return entries[0] ?? requestOrigin ?? '*'
}

function buildCorsHeaders(request: Request, allowed?: string) {
  const origin = request.headers.get('Origin')
  const resolved = resolveAllowedOrigin(origin, allowed)

  return {
    'Access-Control-Allow-Origin': resolved,
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

async function exchangeToken(code: string, env: Env) {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })

  const payload = await response.json()

  if (!response.ok || !payload.access_token) {
    return { error: payload.error_description || payload.error || 'token_exchange_failed' }
  }

  return {
    access_token: payload.access_token,
    scope: payload.scope ?? '',
    token_type: payload.token_type ?? 'bearer',
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = buildCorsHeaders(request, env.ALLOWED_ORIGIN)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }

    let body: { code?: string } | undefined

    try {
      body = await request.json()
    } catch (error) {
      return new Response(JSON.stringify({ error: 'invalid_json' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!body?.code) {
      return new Response(JSON.stringify({ error: 'missing_code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tokenPayload = await exchangeToken(body.code, env)
    const status = 'error' in tokenPayload ? 400 : 200

    return new Response(JSON.stringify(tokenPayload), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  },
}
```

## 2. Wrangler project setup (CLI)

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Create a worker project**
   ```bash
   mkdir github-oauth-worker
   cd github-oauth-worker
   wrangler init --no-open
   ```

3. **Configure `wrangler.toml`**
   ```toml
   name = "prompt-hub-oauth"
   main = "src/worker.ts"
   compatibility_date = "2023-10-30"
   ```
   If you use JavaScript instead of TypeScript, set `main = "worker.js"`.

4. **Add the worker source**
   Copy the TypeScript snippet above into `src/worker.ts`.

5. **Store your secrets**
   ```bash
   wrangler secret put GITHUB_CLIENT_ID
   wrangler secret put GITHUB_CLIENT_SECRET
   wrangler secret put ALLOWED_ORIGIN
   ```
   - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`: from your GitHub OAuth App
   - `ALLOWED_ORIGIN`: the site that is allowed to call the worker (e.g. `https://your-name.github.io`). You can provide a comma-separated list for multiple origins.

6. **Deploy**
   ```bash
   wrangler deploy
   ```
   Wrangler prints the public worker URL (e.g. `https://prompt-hub-oauth.your-account.workers.dev`). Use that value for `VITE_OAUTH_PROXY_URL` in your `.env` file.

## 3. Deploying through the Cloudflare dashboard

If you prefer the UI:

1. Create a new **HTTP Worker** in the [Cloudflare dashboard](https://dash.cloudflare.com/)
2. Replace the default code with the worker snippet
3. In *Settings → Variables*, add the following **Secrets**: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and optionally `ALLOWED_ORIGIN`
4. Save and deploy

You can bind the worker to a custom domain or route later; a workers.dev subdomain is sufficient for this project and is free.

## 4. Connecting the frontend

Add the following values to your `.env` (see `.env.example`):

```
VITE_GITHUB_CLIENT_ID=xxxxxxxxxxxxxxxx
VITE_OAUTH_PROXY_URL=https://prompt-hub-oauth.your-account.workers.dev
VITE_GITHUB_REPO_OWNER=your-github-username
VITE_GITHUB_REPO_NAME=Prompt-Hub
```

When the Vue app runs, it sends `POST ${VITE_OAUTH_PROXY_URL}/exchange` during the callback step. Ensure that the worker URL matches exactly (no trailing slash needed—the frontend app trims it automatically).

## 5. Testing

Use `curl` to verify the worker before wiring the frontend:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"code":"abc123"}' \
  https://prompt-hub-oauth.your-account.workers.dev/exchange
```

With a valid `code` you will receive `{ "access_token": "..." }`. A malformed request returns a helpful JSON error payload so the frontend can display a message to the user.

## 6. Pricing notes

- The Cloudflare Workers free plan includes 100,000 requests / day, more than enough for the admin sign-in flow.
- You only pay if you deliberately attach a custom domain with paid features; running on the default workers.dev subdomain keeps the flow free of charge.

## 7. Updating secrets

Use `wrangler secret put <NAME>` again (CLI) or the dashboard UI whenever you rotate the GitHub OAuth credentials. No other changes are needed—deployments pick up the new secret immediately.

Once the worker is deployed and the `.env` values are set, the GitHub OAuth flow works transparently for both local development (`npm run dev`) and static hosting on GitHub Pages.
