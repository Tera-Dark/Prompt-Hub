/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GH_APP_CLIENT_ID: string
  readonly VITE_GH_APP_OAUTH_PROXY_URL: string
  readonly VITE_GITHUB_REPO_OWNER: string
  readonly VITE_GITHUB_REPO_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
