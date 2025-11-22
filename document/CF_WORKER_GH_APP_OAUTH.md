# Cloudflare Worker: GitHub App OAuth Proxy

This document provides step-by-step instructions to set up and deploy a Cloudflare Worker that exchanges GitHub OAuth codes for user access tokens using a GitHub App. The worker keeps your app's client secret secure on the serverless edge and exposes a single `/exchange` endpoint that your Vite frontend can call.

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Setup Instructions](#setup-instructions)
5. [Configuration](#configuration)
6. [Deployment](#deployment)
7. [Testing](#testing)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### What This Worker Does

The Cloudflare Worker acts as a secure OAuth proxy that:

- **Accepts** a `POST /exchange` request with JSON body: `{ "code": "...", "redirect_uri": "..." }`
- **Exchanges** the OAuth code for an access token using your GitHub App credentials
- **Returns** a JSON response with: `{ "access_token", "token_type", "scope", "expires_in" }`
- **Secures** your client secret by storing it as a Cloudflare Secret (never exposed to the browser)
- **Enforces** CORS headers with a可配置的允许源

### GitHub App Credentials

Example GitHub App credentials format:

```
Client ID:     YOUR_CLIENT_ID
Client Secret: YOUR_CLIENT_SECRET
Callback URL:  https://your-pages-domain/Prompt-Hub/auth/callback
Homepage:      https://github.com/<your-username>/Prompt-Hub
```

---

## Project Structure

```
cf-worker/
├── src/
│   └── index.ts           # Main worker code (TypeScript)
├── wrangler.toml          # Worker configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── .env.example           # Environment variables template
└── .gitignore            # Git ignore rules
```

---

## Prerequisites

### Before You Start

1. **A Cloudflare account** - Create a free account at https://dash.cloudflare.com/
2. **Node.js 18+** - Download from https://nodejs.org/
3. **npm** - Included with Node.js
4. **GitHub App credentials** - Already provided in the scope section
5. **Git** - To clone and work with the repository

### Verify Your Setup

```bash
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 8.0.0 or higher
```

---

## Setup Instructions

### Step 1: Install Wrangler CLI

Wrangler is Cloudflare's CLI tool for managing Workers. Install it globally:

```bash
npm install -g wrangler
# or if you prefer local installation:
npm install --save-dev wrangler
```

Verify the installation:

```bash
wrangler --version
```

### Step 2: Navigate to the Worker Project

```bash
cd /path/to/Prompt-Hub/cf-worker
```

### Step 3: Install Dependencies

```bash
npm install
```

This will install:

- **TypeScript**: For type checking and compilation
- **@cloudflare/workers-types**: TypeScript definitions for Cloudflare Workers API
- **Wrangler**: The Cloudflare CLI tool

### Step 4: Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate. Follow the prompts:

1. Click "Allow" to authorize Wrangler
2. You'll see a "Success" message
3. Return to your terminal

---

## Configuration

### Step 1: Review `wrangler.toml`

The `wrangler.toml` file is already configured:

```toml
name = "prompt-hub-gh-app-oauth"
main = "src/index.ts"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "prompt-hub-gh-app-oauth"

[build]
command = "npm run build"
cwd = "."
watch_paths = ["src/**/*.ts"]

[build.upload]
format = "service-worker"
```

**Key Settings:**

- **name**: Your worker's name (used in the public URL)
- **main**: Entry point to the worker code
- **compatibility_date**: Cloudflare Workers runtime version to use

### Step 2: Configure Cloudflare Secrets

Your GitHub App credentials must be stored as Cloudflare Secrets. These are secure environment variables that are NOT stored in your repository.

#### Method 1: Using Wrangler CLI (Recommended)

```bash
# Store your Client ID
wrangler secret put CLIENT_ID
# Paste your Client ID when prompted
# Press Enter twice (Ctrl+D on Unix, Ctrl+Z then Enter on Windows)

# Store your Client Secret
wrangler secret put CLIENT_SECRET
# Paste your Client Secret when prompted
# Press Enter twice
```

#### Method 2: Using Cloudflare Dashboard

1. Go to https://dash.cloudflare.com/
2. Select your account
3. Navigate to **Workers & Pages** → **prompt-hub-gh-app-oauth**
4. Go to **Settings** → **Variables**
5. Click **Add Secret** for each:
   - **Name**: `CLIENT_ID` → **Value**: `YOUR_CLIENT_ID`
   - **Name**: `CLIENT_SECRET` → **Value**: `YOUR_CLIENT_SECRET`

### Step 3: Verify Secrets

```bash
wrangler secret list
```

You should see:

```
CLIENT_ID
CLIENT_SECRET
```

---

## Deployment

### Option 1: Deploy with Wrangler CLI (Recommended)

```bash
# Build the TypeScript code
npm run build

# Deploy to Cloudflare Workers
npm run deploy
# or
wrangler deploy
```

**Expected Output:**

```
✓ Uploaded prompt-hub-gh-app-oauth
  https://prompt-hub-gh-app-oauth.YOUR_ACCOUNT.workers.dev
```

### Option 2: Deploy via Cloudflare Dashboard

If you prefer the web UI:

1. Go to https://dash.cloudflare.com/
2. Navigate to **Workers & Pages**
3. Click **Create application** → **Create Worker**
4. Replace the default code with the contents of `cf-worker/src/index.ts`
5. Click **Save and Deploy**
6. Configure secrets in **Settings → Variables** (as described above)

### Getting Your Worker URL

After successful deployment, note your worker URL:

```
https://prompt-hub-gh-app-oauth.YOUR_ACCOUNT.workers.dev
```

Replace `YOUR_ACCOUNT` with your actual Cloudflare account identifier.

---

## Integration with Frontend

Once deployed, configure your frontend `.env` file:

```bash
# .env file in the Prompt-Hub repository root
VITE_GH_APP_OAUTH_PROXY_URL=https://prompt-hub-gh-app-oauth.YOUR_ACCOUNT.workers.dev
```

The frontend will use this URL when exchanging the OAuth code:

```typescript
// Your frontend code
const response = await fetch(`${VITE_GH_APP_OAUTH_PROXY_URL}/exchange`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code, redirect_uri }),
})
```

---

## Testing

### Test 1: Verify Worker Compilation

```bash
cd cf-worker
npm run build
```

You should see compiled JavaScript files in the `dist/` directory with no errors.

### Test 2: Verify Worker Locally

```bash
npm run dev
```

This starts a local development server, typically at `http://localhost:8787`.

Test the endpoint with curl:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://your-pages-domain" \
  -d '{"code":"test_code","redirect_uri":"https://your-pages-domain/Prompt-Hub/auth/callback"}' \
  http://localhost:8787/exchange
```

### Test 3: Check CORS Headers

```bash
curl -X OPTIONS \
  -H "Origin: https://your-pages-domain" \
  -v \
  https://prompt-hub-gh-app-oauth.YOUR_ACCOUNT.workers.dev/exchange
```

You should see in the response headers:

```
Access-Control-Allow-Origin: <configured allowed origin>
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Test 4: Test CORS Restrictions

Try with a disallowed origin:

```bash
curl -X OPTIONS \
  -H "Origin: https://malicious-site.com" \
  -v \
  https://prompt-hub-gh-app-oauth.YOUR_ACCOUNT.workers.dev/exchange
```

The `Access-Control-Allow-Origin` header should still be set to the allowed origin only (not the request origin).

### Test 5: End-to-End Test with Real OAuth Code

During GitHub OAuth flow:

1. User is redirected to GitHub's OAuth page
2. After authorization, GitHub redirects to: `https://your-pages-domain/Prompt-Hub/auth/callback?code=XXXXX`
3. Frontend extracts the code and makes a request:

```typescript
const response = await fetch('https://prompt-hub-gh-app-oauth.YOUR_ACCOUNT.workers.dev/exchange', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'XXXXX',
    redirect_uri: 'https://your-pages-domain/Prompt-Hub/auth/callback',
  }),
})

const data = await response.json()
// Should contain: { access_token, token_type, scope, expires_in }
```

---

## Security Best Practices

### 1. Never Commit Secrets

The `.gitignore` file prevents committing:

- `.env.local` - local environment variables
- `.wrangler/` - local wrangler configuration with secrets

**Never manually add secrets to your code or configuration files.**

### 2. Use Cloudflare Secrets

Your GitHub App client secret is protected by:

- **Encryption at rest** - Cloudflare encrypts all secrets
- **Encryption in transit** - TLS 1.3+ for all communication
- **Access control** - Secrets are only available within your worker code
- **Audit logs** - All secret access is logged (available in Cloudflare dashboard)

### 3. CORS Security

The worker enforces:

- **Allowed Origin**: 通过环境变量 `ALLOWED_ORIGIN` 配置
- **Method Restrictions**: Only `POST` and `OPTIONS` methods allowed
- **Credential Handling**: Credentials are not sent or stored by the worker

### 4. Input Validation

The worker validates:

- Required `code` parameter
- Required `redirect_uri` parameter
- Valid JSON in request body
- HTTP method

### 5. Error Handling

The worker returns helpful error messages without exposing sensitive information:

- `missing_code` - If OAuth code is not provided
- `missing_redirect_uri` - If redirect URI is not provided
- `token_exchange_failed` - If GitHub API returns an error
- `invalid_request` - For malformed requests

### 6. Rotating Credentials

If you need to rotate your GitHub App credentials:

1. Generate new credentials in GitHub Settings
2. Update the secrets:

```bash
wrangler secret put CLIENT_ID
# Enter the new Client ID

wrangler secret put CLIENT_SECRET
# Enter the new Client Secret
```

3. The worker automatically uses the new secrets on the next request
4. No redeployment needed

---

## Monitoring and Logging

### View Worker Logs

```bash
# Tail live logs
wrangler tail
```

This shows:

- Request details
- Response status codes
- Any error messages
- Performance metrics

### Cloudflare Dashboard Analytics

1. Go to https://dash.cloudflare.com/
2. Navigate to **Workers & Pages** → **prompt-hub-gh-app-oauth**
3. View **Logs** for recent requests
4. Check **Analytics** for traffic patterns

---

## Troubleshooting

### Issue: "Unauthorized" when running `wrangler login`

**Solution**:

- Clear Wrangler cache: `wrangler logout` then `wrangler login`
- Ensure you're using a free or paid Cloudflare account

### Issue: "SECRET_NOT_FOUND" error when deploying

**Solution**:

```bash
# Verify secrets are configured
wrangler secret list

# If missing, add them:
wrangler secret put CLIENT_ID
wrangler secret put CLIENT_SECRET
```

### Issue: CORS errors in browser console

**Solution**:

- Verify the frontend origin matches你配置在 Worker 的允许源
- For local development, use the environment variable `VITE_GH_APP_OAUTH_PROXY_URL` pointing to the deployed worker

### Issue: "Invalid OAuth code" error from GitHub

**Solution**:

- Ensure the `code` is freshly obtained (expires in 10 minutes)
- Verify the `redirect_uri` matches exactly what's registered in GitHub App settings
- Check GitHub App settings match the provided credentials

### Issue: TypeScript compilation errors

**Solution**:

```bash
# Ensure you have the correct TypeScript version
npm install --save-dev typescript@^5.4.2

# Try compiling with verbose output
npm run build -- --diagnostics
```

### Issue: Worker returns 404 for `/exchange` endpoint

**Solution**:

- Verify you're sending a `POST` request (not GET)
- Check the URL path is exactly `/exchange` (no trailing slash)
- Ensure the worker has been deployed: `npm run deploy`

---

## Free Plan Limitations and Pricing

### What's Included in Free Plan

- ✅ **100,000 requests/day** - More than enough for OAuth flow
- ✅ **Unlimited workers** - Deploy multiple workers if needed
- ✅ **Custom domains** - At no additional cost (with your own domain)
- ✅ **SSL/TLS** - Automatically included
- ✅ **30-day logs** - View recent requests

### What Requires Payment

- Custom domain on Cloudflare (if you don't use workers.dev subdomain)
- Additional compute resources (very rare)

**For this project, you pay $0 per month** when using the `workers.dev` subdomain.

---

## Advanced Configuration

### Custom Domain Binding

If you want to bind the worker to a custom domain:

1. Own or control a domain registered with Cloudflare
2. In `wrangler.toml`, add a route:

```toml
routes = [
  { pattern = "oauth.yourdomain.com", zone_name = "yourdomain.com" }
]
```

3. Redeploy: `wrangler deploy`

### Production vs Development

For production deployments:

```bash
# Deploy to production environment
wrangler deploy --env production
```

### Upgrading Node Compatibility

If you need Node.js APIs:

```toml
compatibility_flags = ["nodejs_compat"]
```

This is already included in the provided `wrangler.toml`.

---

## Reference

### API Endpoint

**POST /exchange**

**Request Body:**

```json
{
  "code": "string (required) - OAuth code from GitHub",
  "redirect_uri": "string (required) - Must match GitHub App redirect URI"
}
```

**Success Response (200):**

```json
{
  "access_token": "gho_16C7e42F292c6912E7710c838347Ae178B4a",
  "token_type": "bearer",
  "scope": "user:email,gist",
  "expires_in": 28800
}
```

**Error Response (400/405):**

```json
{
  "error": "error_code",
  "error_description": "Human-readable error message"
}
```

### CORS Headers

All responses include:

```
Access-Control-Allow-Origin: <configured allowed origin>
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

---

## Summary

You now have a production-ready GitHub App OAuth proxy running on Cloudflare Workers. The setup:

1. ✅ Keeps your client secret secure
2. ✅ Handles OAuth code exchange
3. ✅ Enforces CORS restrictions
4. ✅ Scales to handle high traffic
5. ✅ Costs $0 per month on the free plan

### Next Steps

1. **Deploy the worker**: `npm run deploy`
2. **Configure your frontend**: Add `VITE_GH_APP_OAUTH_PROXY_URL` to `.env`
3. **Test the flow**: Run your Vite app and verify OAuth callback works
4. **Monitor**: Check logs in Cloudflare dashboard if issues arise

For questions or issues, refer to the troubleshooting section or check the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/).
