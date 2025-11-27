import { computed, ref, type ComputedRef } from 'vue'
import {
  createOAuthState,
  getAuthUrl,
  getStoredSession,
  handleCallback,
  logout as clearStoredSession,
  verifyRepoAccess,
  saveSession,
  type AuthSession,
  type GitHubUser,
} from '@/utils/github-auth'

type AuthComposable = {
  login: (redirectPath?: string) => void
  logout: () => void
  completeLogin: (code: string, state: string) => Promise<string>
  isAuthed: ComputedRef<boolean>
  user: ComputedRef<GitHubUser | null>
  token: ComputedRef<string | null>
  hasRepoWriteAccess: ComputedRef<boolean>
  isProcessing: ComputedRef<boolean>
  error: ComputedRef<string | null>
  attemptedRoute: ComputedRef<string | null>
  setAttemptedRoute: (path: string | null) => void
  clearAttemptedRoute: () => void
  isReady: ComputedRef<boolean>
  clearError: () => void
  refreshFromStorage: () => AuthSession | null
}

let authComposable: AuthComposable | null = null

export function useAuth(): AuthComposable {
  if (authComposable) {
    return authComposable
  }

  const token = ref<string | null>(null)
  const user = ref<GitHubUser | null>(null)
  const hasRepoWriteAccess = ref(false)
  const isProcessing = ref(false)
  const error = ref<string | null>(null)
  const attemptedRoute = ref<string | null>(null)
  const isRestored = ref(false)

  function restoreFromStorage(): AuthSession | null {
    if (typeof window === 'undefined') {
      isRestored.value = true
      return null
    }

    const session = getStoredSession()

    if (session) {
      token.value = session.token
      user.value = session.user
      // Default to false if undefined, but trigger a check
      hasRepoWriteAccess.value = !!session.hasRepoWriteAccess

      // If hasRepoWriteAccess is undefined (old session), verify it now
      if (session.hasRepoWriteAccess === undefined) {
        verifyRepoAccess(session.token).then((access) => {
          hasRepoWriteAccess.value = access
          // Update stored session
          saveSession({
            ...session,
            hasRepoWriteAccess: access,
          })
        })
      }
    } else {
      token.value = null
      user.value = null
      hasRepoWriteAccess.value = false
    }

    isRestored.value = true
    return session
  }

  restoreFromStorage()

  function setAttemptedRoute(path: string | null) {
    attemptedRoute.value = path
  }

  function login(redirectPath?: string) {
    if (typeof window === 'undefined') {
      return
    }

    const state = createOAuthState()
    const target = redirectPath ?? attemptedRoute.value ?? '/admin/dashboard'
    attemptedRoute.value = target

    const url = getAuthUrl(state)
    window.location.assign(url)
  }

  async function completeLogin(code: string, state: string) {
    isProcessing.value = true
    error.value = null

    try {
      const session = await handleCallback(code, state)
      token.value = session.token
      user.value = session.user
      hasRepoWriteAccess.value = session.hasRepoWriteAccess

      const destination = attemptedRoute.value ?? '/admin/dashboard'
      attemptedRoute.value = null

      return destination
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Authentication failed. Please try signing in again.'
      error.value = message
      throw new Error(message)
    } finally {
      isProcessing.value = false
    }
  }

  function logout() {
    clearStoredSession()
    token.value = null
    user.value = null
    hasRepoWriteAccess.value = false
    attemptedRoute.value = null
    error.value = null
  }

  function clearError() {
    error.value = null
  }

  authComposable = {
    login,
    logout,
    completeLogin,
    isAuthed: computed(() => Boolean(token.value && user.value)),
    user: computed(() => user.value),
    token: computed(() => token.value),
    hasRepoWriteAccess: computed(() => hasRepoWriteAccess.value),
    isProcessing: computed(() => isProcessing.value),
    error: computed(() => error.value),
    attemptedRoute: computed(() => attemptedRoute.value),
    setAttemptedRoute,
    clearAttemptedRoute: () => {
      attemptedRoute.value = null
    },
    isReady: computed(() => isRestored.value),
    clearError,
    refreshFromStorage: restoreFromStorage,
  }

  return authComposable
}
