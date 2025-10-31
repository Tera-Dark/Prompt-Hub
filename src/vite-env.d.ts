/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_CLIENT_ID: string
  readonly VITE_OAUTH_PROXY_URL: string
  readonly VITE_GITHUB_REPO_OWNER: string
  readonly VITE_GITHUB_REPO_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
