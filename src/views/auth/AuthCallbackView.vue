<template>
  <section class="auth-callback">
    <div class="callback-card" :class="{ 'has-error': status === 'error' }">
      <h2>{{ status === 'processing' ? 'Finishing sign-in…' : 'Authentication error' }}</h2>
      <p v-if="status === 'processing'">
        We're finalising your GitHub authentication. You will be redirected automatically once the
        sign-in is complete.
      </p>
      <template v-else>
        <p>{{ message }}</p>
        <div class="callback-actions">
          <button type="button" class="callback-button" @click="retryLogin">Try again</button>
          <RouterLink to="/" class="callback-link">Return to public site</RouterLink>
        </div>
      </template>
      <p v-if="status === 'processing'" class="redirect-hint">
        If this takes longer than a few seconds you can close this tab and start again.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

type ViewStatus = 'processing' | 'error'

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const status = ref<ViewStatus>('processing')
const message = ref('')

onMounted(async () => {
  const codeParam = route.query.code
  const stateParam = route.query.state

  const code = Array.isArray(codeParam) ? codeParam[0] : codeParam
  const state = Array.isArray(stateParam) ? stateParam[0] : stateParam

  if (typeof code !== 'string' || typeof state !== 'string') {
    status.value = 'error'
    message.value = 'Missing OAuth parameters. Please restart the sign-in process.'
    return
  }

  try {
    const destination = await auth.completeLogin(code, state)
    await router.replace(destination)
  } catch (error) {
    status.value = 'error'
    message.value =
      error instanceof Error ? error.message : 'Authentication failed. Please try again.'
  }
})

function retryLogin() {
  const target = auth.attemptedRoute.value ?? undefined
  auth.login(target)
}
</script>

<style scoped>
.auth-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-gray-100);
  padding: 2rem;
}

.callback-card {
  max-width: 460px;
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: left;
}

.callback-card.has-error {
  border-color: var(--color-red-600);
}

.callback-card h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-gray-900);
}

.callback-card p {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
  line-height: 1.6;
  margin: 0;
}

.callback-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.callback-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--text-sm);
  font-weight: 600;
  background: var(--color-black);
  color: var(--color-white);
  border-radius: var(--radius-md);
  padding: 0.65rem 1.25rem;
  transition: background-color var(--transition-base);
}

.callback-button:hover,
.callback-button:focus-visible {
  background: var(--color-gray-900);
}

.callback-link {
  align-self: flex-start;
  font-size: var(--text-sm);
  color: var(--color-gray-600);
  border-bottom: 1px solid transparent;
  padding-bottom: 0.125rem;
  transition:
    color var(--transition-base),
    border-color var(--transition-base);
}

.callback-link:hover,
.callback-link:focus-visible {
  color: var(--color-gray-900);
  border-color: var(--color-gray-900);
}

.redirect-hint {
  font-size: var(--text-xs);
  color: var(--color-gray-500);
}
</style>
