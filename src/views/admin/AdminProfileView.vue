<template>
  <section class="profile">
    <header class="profile-header">
      <div class="user">
        <img v-if="user?.avatar_url" :src="user?.avatar_url || ''" alt="avatar" class="avatar" />
        <div class="meta">
          <h2>{{ user?.login }}</h2>
          <p>{{ user?.name || user?.html_url }}</p>
          <a :href="user?.html_url || '#'" target="_blank" rel="noopener" class="link">GitHub</a>
        </div>
      </div>
    </header>

    <div class="card">
      <div class="card-header">
        <h3>My pull requests</h3>
      </div>
      <ul class="pr-list" v-if="prs.length">
        <li v-for="item in prs" :key="item.id" class="pr-row">
          <div class="pr-title">
            <a :href="item.html_url" target="_blank" rel="noopener">#{{ item.number }} · {{ item.title }}</a>
          </div>
          <div class="pr-meta">
            <span class="state" :data-state="item.state">{{ item.state }}</span>
            <span class="date">{{ formatDate(item.created_at) }}</span>
          </div>
        </li>
      </ul>
      <div v-else class="empty">No pull requests found.</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

type PRItem = {
  id: number
  number: number
  title: string
  html_url: string
  state: 'open' | 'closed'
  created_at: string
}

const { user: u, token } = useAuth()
const user = computed(() => u.value)
const prs = ref<PRItem[]>([])

const owner = import.meta.env.VITE_GITHUB_REPO_OWNER
const repo = import.meta.env.VITE_GITHUB_REPO_NAME

function formatDate(s: string) {
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toLocaleString()
}

onMounted(async () => {
  try {
    if (!token.value || !user.value?.login) return
    const q = `repo:${owner}/${repo}+type:pr+author:${encodeURIComponent(user.value.login)}`
    const url = `https://api.github.com/search/issues?q=${q}&sort=created&order=desc&per_page=20`
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token.value}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    const data = await res.json()
    const items = (data.items || []) as any[]
    prs.value = items.map((it) => ({
      id: it.id,
      number: it.number,
      title: it.title,
      html_url: it.html_url,
      state: it.state,
      created_at: it.created_at,
    }))
  } catch {}
})
</script>

<style scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-header .user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 9999px;
  border: 1px solid var(--color-gray-300);
}

.meta h2 {
  margin: 0;
  font-size: var(--text-xl);
}

.meta p {
  margin: 0.25rem 0;
  color: var(--color-gray-600);
}

.link {
  font-size: var(--text-sm);
}

.card {
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.card-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-gray-100);
}

.pr-list {
  display: flex;
  flex-direction: column;
}

.pr-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-gray-100);
}

.pr-title a {
  color: var(--color-gray-900);
}

.pr-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.state[data-state="open"] {
  color: var(--color-green-600, #16a34a);
}

.state[data-state="closed"] {
  color: var(--color-red-600, #dc2626);
}

.empty {
  padding: 1rem 1.25rem;
  color: var(--color-gray-600);
}
</style>
