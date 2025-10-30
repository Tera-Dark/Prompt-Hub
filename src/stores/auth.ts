import { computed, ref } from 'vue'

const isAuthenticated = ref(false)
const attemptedRoute = ref<string | null>(null)

export function useAuthStore() {
  function setAuthenticated(value: boolean) {
    isAuthenticated.value = value
  }

  function setAttemptedRoute(path: string | null) {
    attemptedRoute.value = path
  }

  function clearAttemptedRoute() {
    attemptedRoute.value = null
  }

  function startLogin() {
    console.info('[auth] Initiate OAuth flow (stub).')
  }

  return {
    isAuthenticated: computed(() => isAuthenticated.value),
    attemptedRoute: computed(() => attemptedRoute.value),
    setAuthenticated,
    setAttemptedRoute,
    clearAttemptedRoute,
    startLogin,
  }
}
