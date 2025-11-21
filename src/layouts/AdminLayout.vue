<template>
  <div class="admin-shell">
    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="closeSidebar" />

    <aside :class="['admin-sidebar', { 'is-open': sidebarOpen }]">
      <div class="sidebar-header">
        <span class="sidebar-logo">Prompt Hub</span>
        <button
          type="button"
          class="sidebar-close"
          aria-label="Close navigation"
          @click="closeSidebar"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <nav v-if="hasRepoWriteAccess" class="sidebar-nav" aria-label="Admin">
        <RouterLink
          v-for="item in navigation"
          :key="item.label"
          :to="item.to"
          class="sidebar-link"
          :class="{ 'is-active': item.match.test(route.path) }"
          @click="closeSidebar"
        >
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <div class="admin-workspace">
      <header class="admin-header">
        <button
          type="button"
          class="menu-toggle"
          aria-label="Toggle navigation"
          @click="toggleSidebar"
        >
          <span aria-hidden="true">☰</span>
        </button>
        <div class="header-context">
          <h1 class="context-title">{{ currentSection }}</h1>
          <p class="context-subtitle">Manage the tools that power Prompt Hub</p>
        </div>
        <div class="header-actions">
          <RouterLink to="/" class="header-link">Public site</RouterLink>
          <button
            v-if="!isAuthenticated"
            type="button"
            class="header-link header-link--cta"
            @click="handleLogin"
          >
            Sign in with GitHub
          </button>
          <div v-else class="user-menu-wrapper" @click.stop>
            <button
              type="button"
              class="user-menu-trigger"
              :aria-expanded="userMenuOpen"
              aria-haspopup="true"
              @click="toggleUserMenu"
            >
              <img
                v-if="currentUser?.avatar_url"
                :src="currentUser.avatar_url"
                alt="User avatar"
                class="user-avatar"
              />
              <div class="user-info">
                <span class="user-name">{{
                  currentUser?.name || currentUser?.login || 'User'
                }}</span>
                <span class="user-role">{{ hasRepoWriteAccess ? 'Admin' : 'Viewer' }}</span>
              </div>
              <span class="menu-arrow" :class="{ 'is-open': userMenuOpen }">▼</span>
            </button>
            <div v-if="userMenuOpen" class="user-dropdown" @click.stop>
              <div class="dropdown-header">
                <img
                  v-if="currentUser?.avatar_url"
                  :src="currentUser.avatar_url"
                  alt="User avatar"
                  class="dropdown-avatar"
                />
                <div class="dropdown-user-info">
                  <strong>{{ currentUser?.name || currentUser?.login }}</strong>
                  <span class="dropdown-email">{{ currentUser?.email || currentUser?.login }}</span>
                  <a
                    v-if="currentUser?.html_url"
                    :href="currentUser.html_url"
                    target="_blank"
                    rel="noopener"
                    class="github-link"
                  >
                    View on GitHub →
                  </a>
                </div>
              </div>
              <div class="dropdown-divider"></div>
              <nav class="dropdown-nav">
                <RouterLink to="/admin/profile" class="dropdown-link" @click="closeUserMenu">
                  <span>👤</span>
                  <span>My Profile</span>
                </RouterLink>
                <RouterLink to="/admin/prompts" class="dropdown-link" @click="closeUserMenu">
                  <span>📝</span>
                  <span>My Prompts</span>
                </RouterLink>
                <RouterLink to="/admin/settings" class="dropdown-link" @click="closeUserMenu">
                  <span>⚙️</span>
                  <span>Settings</span>
                </RouterLink>
              </nav>
              <div class="dropdown-divider"></div>
              <button
                type="button"
                class="dropdown-link dropdown-link--danger"
                @click="handleLogout"
              >
                <span>🚪</span>
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="admin-content">
        <RouterView v-if="isAuthenticated && hasRepoWriteAccess" />
        <section
          v-else-if="isAuthenticated"
          class="admin-auth-gate"
          aria-labelledby="admin-auth-heading"
        >
          <div class="auth-card auth-card--warning">
            <h2 id="admin-auth-heading">Write access required</h2>
            <p>
              {{ userDisplayName }} is signed in, but this account does not have write access to
              <span class="repo-slug">{{ repoTarget }}</span
              >.
            </p>
            <p>
              Ask the repository owner to grant the required permissions, or sign in with a
              different GitHub account.
            </p>
            <div class="auth-actions">
              <button type="button" class="cta-button" @click="handleLogout">Switch account</button>
              <RouterLink to="/" class="secondary-link">Return to public site</RouterLink>
            </div>
          </div>
        </section>
        <section v-else class="admin-auth-gate" aria-labelledby="admin-auth-heading">
          <div class="auth-card">
            <h2 id="admin-auth-heading">Admin access required</h2>
            <p>
              Sign in to continue to
              <span class="attempted-route">{{ attemptedRouteLabel }}</span
              >. Only collaborators with write access to
              <span class="repo-slug">{{ repoTarget }}</span>
              can use the admin tools.
            </p>
            <div class="auth-actions">
              <button type="button" class="cta-button" @click="handleLogin">
                Sign in with GitHub
              </button>
              <RouterLink to="/" class="secondary-link">Return to public site</RouterLink>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

type NavigationItem = {
  label: string
  to: { name: string }
  match: RegExp
}

const navigation: NavigationItem[] = [
  { label: 'Dashboard', to: { name: 'AdminDashboard' }, match: /^\/admin(?:\/dashboard)?$/ },
  { label: 'Prompts', to: { name: 'AdminPrompts' }, match: /^\/admin\/prompts(\/.*)?$/ },
  { label: 'Review', to: { name: 'AdminReview' }, match: /^\/admin\/review$/ },
  { label: 'Data tools', to: { name: 'AdminData' }, match: /^\/admin\/data$/ },
]

const route = useRoute()
const sidebarOpen = ref(false)
const userMenuOpen = ref(false)
const auth = useAuth()

const isAuthenticated = computed(() => auth.isAuthed.value)
const hasRepoWriteAccess = computed(() => auth.hasRepoWriteAccess.value)
const currentUser = computed(() => auth.user.value)
const attemptedRoute = computed(() => auth.attemptedRoute.value)

const repoOwner = import.meta.env.VITE_GITHUB_REPO_OWNER ?? ''
const repoName = import.meta.env.VITE_GITHUB_REPO_NAME ?? ''

const repoTarget = computed(() => {
  if (repoOwner && repoName) {
    return `${repoOwner}/${repoName}`
  }

  return repoOwner || repoName || 'the configured repository'
})

const currentSection = computed(() => {
  const found = navigation.find((item) => item.match.test(route.path))
  return found?.label ?? 'Admin'
})

const attemptedRouteLabel = computed(() => attemptedRoute.value ?? '/admin/dashboard')
const userDisplayName = computed(
  () => currentUser.value?.name || currentUser.value?.login || 'This user',
)

watch(
  () => route.path,
  () => {
    sidebarOpen.value = false
    userMenuOpen.value = false
  },
)

// Close user menu when clicking outside
if (typeof window !== 'undefined') {
  window.addEventListener('click', () => {
    userMenuOpen.value = false
  })
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function closeUserMenu() {
  userMenuOpen.value = false
}

function handleLogin() {
  auth.login(route.fullPath)
}

function handleLogout() {
  userMenuOpen.value = false
  auth.logout()
}
</script>

<style scoped>
.admin-shell {
  min-height: 100vh;
  display: flex;
  background-color: var(--color-gray-100);
  color: var(--color-gray-900);
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 20;
}

.admin-sidebar {
  width: 260px;
  background: var(--color-black);
  color: var(--color-white);
  border-right: 1px solid var(--color-gray-800);
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  transition: transform var(--transition-base);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.sidebar-logo {
  font-size: var(--text-lg);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sidebar-close {
  background: transparent;
  border: none;
  color: var(--color-gray-500);
  font-size: var(--text-xl);
  display: none;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-link {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  color: var(--color-gray-300);
  background: transparent;
  border: 1px solid transparent;
  transition:
    background-color var(--transition-base),
    color var(--transition-base),
    border-color var(--transition-base);
}

.sidebar-link:hover,
.sidebar-link:focus-visible {
  background-color: var(--color-gray-900);
  color: var(--color-white);
  border-color: var(--color-gray-800);
}

.sidebar-link.is-active {
  background-color: var(--color-gray-900);
  color: var(--color-white);
  border-color: var(--color-gray-700);
}

.admin-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.admin-header {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.25rem 2rem;
  background: var(--color-white);
  border-bottom: 1px solid var(--color-gray-200);
  z-index: 10;
}

.menu-toggle {
  display: none;
  background: transparent;
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  padding: 0.35rem 0.65rem;
  font-size: var(--text-lg);
}

.header-context {
  flex: 1;
}

.context-title {
  font-size: var(--text-xl);
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--color-gray-900);
}

.context-subtitle {
  font-size: var(--text-sm);
  color: var(--color-gray-500);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-menu-wrapper {
  position: relative;
}

.user-menu-trigger {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.45rem 0.85rem;
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.user-menu-trigger:hover {
  background: var(--color-gray-50);
  border-color: var(--color-gray-300);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  border: 2px solid var(--color-gray-200);
  object-fit: cover;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
}

.user-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-gray-900);
  line-height: 1.2;
}

.user-role {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  line-height: 1;
}

.menu-arrow {
  font-size: 0.65rem;
  color: var(--color-gray-500);
  transition: transform var(--transition-base);
}

.menu-arrow.is-open {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 280px;
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 50;
  animation: dropdown-slide-in 0.2s ease-out;
}

@keyframes dropdown-slide-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-header {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-gray-50);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.dropdown-avatar {
  width: 48px;
  height: 48px;
  border-radius: 9999px;
  border: 2px solid var(--color-gray-300);
  flex-shrink: 0;
  object-fit: cover;
}

.dropdown-user-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.dropdown-user-info strong {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-gray-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-email {
  font-size: 0.75rem;
  color: var(--color-gray-600);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.github-link {
  font-size: 0.75rem;
  color: var(--color-gray-700);
  margin-top: 0.25rem;
  display: inline-flex;
  align-items: center;
  transition: color var(--transition-base);
}

.github-link:hover {
  color: var(--color-gray-900);
}

.dropdown-divider {
  height: 1px;
  background: var(--color-gray-200);
  margin: 0.5rem 0;
}

.dropdown-nav {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dropdown-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-gray-700);
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-base);
}

.dropdown-link:hover {
  background: var(--color-gray-100);
  color: var(--color-gray-900);
}

.dropdown-link--danger {
  color: var(--color-red-600, #dc2626);
}

.dropdown-link--danger:hover {
  background: var(--color-red-50, #fef2f2);
  color: var(--color-red-700, #b91c1c);
}

.auth-user {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  border: 1px solid var(--color-gray-300);
}

.user-link {
  font-size: var(--text-sm);
  color: var(--color-gray-700);
}

.auth-status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-sm);
  padding: 0.35rem 0.65rem;
  border-radius: var(--radius-md);
  background-color: var(--color-gray-100);
  color: var(--color-gray-600);
  border: 1px solid var(--color-gray-200);
}

.auth-status.is-authenticated {
  background-color: var(--color-gray-900);
  color: var(--color-white);
  border-color: var(--color-gray-800);
}

.status-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background-color: currentColor;
}

.header-link {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-200);
  transition:
    background-color var(--transition-base),
    color var(--transition-base);
}

.header-link:hover,
.header-link:focus-visible {
  background-color: var(--color-gray-900);
  color: var(--color-white);
  border-color: var(--color-gray-900);
}

.header-link--cta {
  background-color: var(--color-black);
  color: var(--color-white);
  border-color: var(--color-black);
}

.header-link--cta:hover,
.header-link--cta:focus-visible {
  background-color: var(--color-gray-900);
  border-color: var(--color-gray-900);
}

.header-link--ghost {
  background-color: transparent;
  color: var(--color-gray-600);
}

.header-link--ghost:hover,
.header-link--ghost:focus-visible {
  background-color: var(--color-gray-200);
  color: var(--color-gray-900);
  border-color: var(--color-gray-300);
}

.admin-content {
  flex: 1;
  padding: 2rem;
  background: var(--color-gray-100);
}

.admin-auth-gate {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 160px);
}

.auth-card {
  max-width: 480px;
  width: 100%;
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-card--warning {
  background: var(--color-gray-50);
  border-color: var(--color-gray-300);
}

.auth-card h2 {
  font-size: var(--text-xl);
  color: var(--color-gray-900);
}

.auth-card p {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
  line-height: 1.6;
}

.attempted-route {
  font-weight: 600;
  color: var(--color-gray-900);
}

.repo-slug {
  font-weight: 600;
  color: var(--color-gray-900);
}

.auth-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cta-button {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: var(--text-sm);
  font-weight: 600;
  background-color: var(--color-black);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-base);
}

.cta-button:hover,
.cta-button:focus-visible {
  background-color: var(--color-gray-900);
}

.secondary-link {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
  text-align: center;
  border-bottom: 1px solid transparent;
  padding-bottom: 0.1rem;
}

.secondary-link:hover,
.secondary-link:focus-visible {
  color: var(--color-gray-900);
  border-color: var(--color-gray-400);
}

@media (max-width: 1024px) {
  .admin-shell {
    position: relative;
  }

  .admin-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    transform: translateX(-100%);
    z-index: 30;
    box-shadow: var(--shadow-lg);
  }

  .admin-sidebar.is-open {
    transform: translateX(0);
  }

  .sidebar-close {
    display: inline-flex;
  }

  .menu-toggle {
    display: inline-flex;
  }
}

@media (max-width: 720px) {
  .admin-header {
    padding: 1rem 1.25rem;
    flex-wrap: wrap;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .user-info {
    display: none;
  }

  .user-dropdown {
    right: 0;
    left: auto;
  }

  .admin-content {
    padding: 1.5rem 1.25rem;
  }

  .auth-card {
    padding: 1.75rem;
  }
}
</style>
