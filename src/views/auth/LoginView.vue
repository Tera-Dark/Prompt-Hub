<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">{{ t('app.name') }}</h1>
        <p class="login-subtitle">Minimalist Prompt Management</p>
      </div>

      <div class="login-actions">
        <Button variant="primary" block size="lg" :loading="isLoading" @click="handleLogin">
          <template #icon-left>
            <svg height="20" viewBox="0 0 16 16" version="1.1" width="20" aria-hidden="true">
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
              ></path>
            </svg>
          </template>
          {{ t('auth.signInWithGithub') }}
        </Button>

        <Button
          v-if="isDev"
          variant="outline"
          block
          size="lg"
          class="dev-login-btn"
          @click="handleDevLogin"
        >
          Dev Login (Local)
        </Button>
      </div>

      <div class="login-footer">
        <router-link to="/" class="back-link">← {{ t('auth.returnToPublic') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import Button from '@/components/ui/Button.vue'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const { login } = useAuth()
const isLoading = ref(false)
const toast = useToast()

async function handleLogin() {
  isLoading.value = true
  try {
    await login()
  } catch (error) {
    console.error('Login failed:', error)
    toast.error(t('auth.loginFailed') || 'Login failed')
    isLoading.value = false
  }
}

const isDev = import.meta.env.DEV

function handleDevLogin() {
  import('@/utils/github-auth').then((m) => {
    m.mockLogin()
    window.location.href = import.meta.env.BASE_URL
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background);
  padding: 1.5rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 3rem 2rem;
  text-align: center;
}

@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.5rem;
  }
}

.login-header {
  margin-bottom: 3rem;
}

.login-title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.login-subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.login-actions {
  margin-bottom: 2rem;
}

.login-footer {
  margin-top: 2rem;
}

.back-link {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  transition: color var(--transition-base);
}

.back-link:hover {
  color: var(--color-text-primary);
}
</style>
