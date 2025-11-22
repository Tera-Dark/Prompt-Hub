# Cloudflare Worker: GitHub App OAuth Proxy

A TypeScript-based Cloudflare Worker that securely exchanges GitHub OAuth codes for user access tokens.

## Quick Start

### Prerequisites

- Node.js 18+
- npm
- Cloudflare account
- Wrangler CLI

### Installation

```bash
npm install -g wrangler
npm install
```

### Configuration

Store your GitHub App credentials as Cloudflare Secrets:

```bash
wrangler secret put CLIENT_ID
# Enter your GitHub App Client ID

wrangler secret put CLIENT_SECRET
# Enter your GitHub App Client Secret
```

### Deployment

```bash
npm run build
npm run deploy
```

Your worker will be deployed at:

```
https://prompt-hub-gh-app-oauth.<your-account>.workers.dev
```

### Usage

Send a POST request to `/exchange`:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://tera-dark.github.io" \
  -d '{"code":"your_oauth_code","redirect_uri":"https://tera-dark.github.io/Prompt-Hub/auth/callback"}' \
  https://prompt-hub-gh-app-oauth.your-account.workers.dev/exchange
```

Response:

```json
{
  "access_token": "gho_...",
  "token_type": "bearer",
  "scope": "user:email,gist",
  "expires_in": 28800
}
```

## Available Scripts

- `npm run build` - Compile TypeScript
- `npm run dev` - Start local development server
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run test` - Run tests (if configured)

## Features

✅ Exchanges GitHub OAuth codes for access tokens
✅ Stores secrets securely in Cloudflare
✅ CORS protection（允许源可配置）
✅ TypeScript for type safety
✅ Error handling with descriptive messages
✅ Works on Cloudflare free plan

## Documentation

For detailed setup, configuration, and troubleshooting, see:
[../../document/CF_WORKER_GH_APP_OAUTH.md](../../document/CF_WORKER_GH_APP_OAUTH.md)

## Project Structure

```
├── src/
│   └── index.ts          # Worker code
├── wrangler.toml         # Cloudflare configuration
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── .env.example          # Environment template
```

## Security

- Client secret is stored as a Cloudflare Secret (not in code)
- CORS 允许源通过环境变量配置
- Input validation on all requests
- No sensitive data in error messages
- TLS 1.3+ encryption for all communication

## Deployment

### First Time

```bash
wrangler login
wrangler secret put CLIENT_ID
wrangler secret put CLIENT_SECRET
npm run deploy
```

### Updates

```bash
npm run build
npm run deploy
```

Secrets persist across deployments.

## Support

See [CF_WORKER_GH_APP_OAUTH.md](../../document/CF_WORKER_GH_APP_OAUTH.md) for troubleshooting and advanced configuration.
