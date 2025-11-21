#!/usr/bin/env node
const required = [
  'VITE_GITHUB_CLIENT_ID',
  'VITE_OAUTH_PROXY_URL',
  'VITE_GITHUB_REPO_OWNER',
  'VITE_GITHUB_REPO_NAME',
]

const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim().length === 0)
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`)
  process.exit(1)
}
console.log('All required env vars present')
