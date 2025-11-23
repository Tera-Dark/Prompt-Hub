<template>
  <section class="review">
    <header class="review-header">
      <h2>Review</h2>
      <p>Review Pull Requests and Issues</p>
    </header>

    <div v-if="!isAuthed" class="auth-hint">
      <p>Sign in to load pull requests.</p>
      <button class="cta" @click="login">Sign in with GitHub</button>
    </div>

    <div v-else class="controls">
      <label class="control">
        <span>State</span>
        <select v-model="state">
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="all">All</option>
        </select>
      </label>
      <label class="control">
        <span>Only mine</span>
        <input v-model="onlyMine" type="checkbox" />
      </label>
      <button class="refresh" @click="load">Refresh</button>
    </div>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-else>
      <div class="stats">
        <span>Open: {{ stats.open }}</span>
        <span>Closed: {{ stats.closed }}</span>
        <span>Total: {{ stats.total }}</span>
      </div>
      <div class="pr-list">
        <article v-for="pr in filtered" :key="pr.id" class="pr-card">
          <div class="card-header">
            <h3>
              <a :href="pr.html_url" target="_blank" rel="noopener"
                >#{{ pr.number }} · {{ pr.title }}</a
              >
            </h3>
            <span class="badge" :data-state="pr.state">{{ pr.state }}</span>
            <span v-if="pr.pull_request" class="badge badge-type">PR</span>
            <span v-else class="badge badge-type">Issue</span>
          </div>
          <div class="card-meta">
            <div class="author">
              <img
                v-if="pr.user?.avatar_url"
                :src="pr.user?.avatar_url || ''"
                class="avatar"
                alt="avatar"
              />
              <a :href="pr.user?.html_url || '#'" target="_blank" rel="noopener">{{
                pr.user?.login
              }}</a>
            </div>
            <span class="date">{{ formatDate(pr.created_at) }}</span>
          </div>
        </article>
        <div v-if="!filtered.length" class="empty">No PRs</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'

type GitHubUserRef = { login: string; avatar_url?: string; html_url?: string }
type Pull = {
  id: number
  number: number
  title: string
  html_url: string
  state: 'open' | 'closed'
  created_at: string
  user?: GitHubUserRef
  pull_request?: any
}

const { token, user: current } = useAuth()
const isAuthed = computed(() => Boolean(token.value))
const owner = import.meta.env.VITE_GITHUB_REPO_OWNER
const repo = import.meta.env.VITE_GITHUB_REPO_NAME

const items = ref<Pull[]>([])
const loading = ref(false)
const state = ref<'open' | 'closed' | 'all'>('open')
const onlyMine = ref(false)
const STATE_KEY = 'prompt-hub::review::state'
const MINE_KEY = 'prompt-hub::review::onlyMine'

function formatDate(s: string) {
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toLocaleString()
}

async function load() {
  if (!token.value) return
  loading.value = true
  try {
    const url = new URL(`https://api.github.com/repos/${owner}/${repo}/issues`)
    if (state.value !== 'all') url.searchParams.set('state', state.value)
    url.searchParams.set('sort', 'created')
    url.searchParams.set('direction', 'desc')
    url.searchParams.set('per_page', '50')
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token.value}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    const data = await res.json()
    items.value = Array.isArray(data) ? (data as Pull[]) : []
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  let list = items.value
  if (onlyMine.value && current.value?.login) {
    list = list.filter((p) => p.user?.login === current.value!.login)
  }
  return list
})

const stats = computed(() => {
  const open = items.value.filter((p) => p.state === 'open').length
  const closed = items.value.filter((p) => p.state === 'closed').length
  return { open, closed, total: items.value.length }
})

function login() {
  // useAuth.login via AdminLayout header button; here we fallback
  window.location.assign('/Prompt-Hub/admin')
}

onMounted(() => {
  try {
    const s = localStorage.getItem(STATE_KEY)
    if (s === 'open' || s === 'closed' || s === 'all') state.value = s as any
    const m = localStorage.getItem(MINE_KEY)
    if (m === '1') onlyMine.value = true
  } catch {
    // Silently fail if preferences cannot be loaded
  }
  if (isAuthed.value) load()
})

watch(state, (v) => {
  try {
    localStorage.setItem(STATE_KEY, v)
  } catch {
    // Silently fail if localStorage is unavailable
  }
})
watch(onlyMine, (v) => {
  try {
    localStorage.setItem(MINE_KEY, v ? '1' : '0')
  } catch {
    // Silently fail if localStorage is unavailable
  }
})
</script>

<style scoped>
.review {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.review-header h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-gray-900);
}

.review-header p {
  color: var(--color-gray-500);
  margin-top: 0.5rem;
}

.auth-hint {
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: 1rem 1.25rem;
}

.cta {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-gray-900);
  border-radius: var(--radius-md);
  background: var(--color-black);
  color: var(--color-white);
}

.controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.control {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.refresh {
  padding: 0.45rem 0.9rem;
  border: 1px solid var(--color-gray-900);
  border-radius: var(--radius-md);
  background: var(--color-white);
}
.stats {
  display: flex;
  gap: 1rem;
  margin: 0.5rem 0;
  font-size: var(--text-sm);
  color: var(--color-gray-700);
}

.pr-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.pr-card {
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.card-header h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-gray-900);
}

.badge {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.25rem 0.55rem;
  border-radius: 9999px;
  background-color: var(--color-gray-900);
  color: var(--color-white);
}

.badge[data-state='open'] {
  background-color: var(--color-green-600, #16a34a);
}
.badge[data-state='closed'] {
  background-color: var(--color-red-600, #dc2626);
}

.badge-type {
  background-color: var(--color-gray-500);
  margin-left: 0.5rem;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-sm);
  color: var(--color-gray-700);
}

.author {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.avatar {
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  border: 1px solid var(--color-gray-300);
}

@media (max-width: 640px) {
  .card-meta {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>
