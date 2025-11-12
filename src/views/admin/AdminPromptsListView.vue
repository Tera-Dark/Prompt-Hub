<template>
  <section class="prompts">
    <header class="prompts-header">
      <div>
        <h2>Prompts</h2>
        <p>Manage prompts from dataset. Supports edit and delete via PR.</p>
      </div>
      <RouterLink to="/admin/prompts/new" class="new-button">New prompt</RouterLink>
    </header>

    <div class="prompts-card" v-if="items.length">
      <header class="prompts-card__header">
        <span>Title</span>
        <span>Category</span>
        <span>Updated</span>
        <span>Actions</span>
      </header>
      <ul class="prompts-list">
        <li v-for="p in items" :key="p.id" class="prompts-row">
          <div class="prompt-info">
            <h3>{{ p.title }}</h3>
            <p>{{ p.description }}</p>
          </div>
          <span class="prompt-status">{{ p.category }}</span>
          <RouterLink :to="`/admin/prompts/${p.id}/edit`" class="prompt-edit">{{ formatUpdated(p) }}</RouterLink>
          <div class="row-actions">
            <RouterLink :to="`/admin/prompts/${p.id}/edit`" class="action">Edit</RouterLink>
            <button class="action danger" @click="onDelete(p.id)" :disabled="submitting">Delete</button>
          </div>
        </li>
      </ul>
    </div>

    <div v-else class="empty">
      <h3>No prompts</h3>
      <p>Please add new prompt or check dataset.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { onMounted, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { loadPrompts, type Prompt } from '@/types/prompt'
import { getDefaultBranch, getBranchSha, createBranch, getFile, updateFile, createPullRequest } from '@/utils/github-repo'

const items = ref<Prompt[]>([])
const submitting = ref(false)
const { token, hasRepoWriteAccess } = useAuth()

const owner = import.meta.env.VITE_GITHUB_REPO_OWNER
const repo = import.meta.env.VITE_GITHUB_REPO_NAME

onMounted(async () => {
  try {
    const data = await loadPrompts()
    items.value = data.prompts
  } catch {}
})

function formatUpdated(p: Prompt) {
  const s = p.updatedAt || p.createdAt
  const d = new Date(s)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

function ensureAuth() {
  if (!token.value || !hasRepoWriteAccess.value) throw new Error('需要登录并具备仓库写权限')
}

async function onDelete(id: string) {
  ensureAuth()
  if (!confirm(`确认删除该提示词？\nID: ${id}`)) return
  submitting.value = true
  try {
    const t = token.value!
    const base = await getDefaultBranch(owner, repo, t)
    const baseSha = await getBranchSha(owner, repo, base, t)
    const branch = `prompt-delete-${id}-${Date.now()}`
    await createBranch(owner, repo, branch, baseSha, t)

    const file = await getFile(owner, repo, 'public/data/prompts.json', base, t)
    const data = JSON.parse(file.content) as { version: string; prompts: Prompt[] }
    const next = { version: data.version, prompts: data.prompts.filter((x) => x.id !== id) }
    const message = `feat: delete prompt ${id}`
    await updateFile(owner, repo, 'public/data/prompts.json', JSON.stringify(next, null, 2), message, branch, file.sha, t)
    const prTitle = `Delete prompt: ${id}`
    const prBody = `Remove prompt ${id}`
    const url = await createPullRequest(owner, repo, prTitle, branch, base, prBody, t)
    alert(`Pull Request 已创建：\n${url}`)
    items.value = next.prompts
  } catch (e) {
    const msg = e instanceof Error ? e.message : '删除失败'
    alert(msg)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.prompts {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.prompts-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.prompts-header h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-gray-900);
}

.prompts-header p {
  color: var(--color-gray-500);
  margin-top: 0.5rem;
}

.new-button {
  padding: 0.65rem 1.1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-900);
  background-color: var(--color-black);
  color: var(--color-white);
  font-size: var(--text-sm);
  transition: background-color var(--transition-base);
}

.new-button:hover,
.new-button:focus-visible {
  background-color: var(--color-gray-900);
}

.prompts-card {
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.prompts-card__header {
  display: grid;
  grid-template-columns: 2fr 160px 160px 220px;
  padding: 1rem 1.5rem;
  font-size: var(--text-sm);
  font-weight: 600;
  background-color: var(--color-gray-50);
  color: var(--color-gray-600);
}

.prompts-list {
  display: flex;
  flex-direction: column;
}

.prompts-row {
  display: grid;
  grid-template-columns: 2fr 160px 160px 220px;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--color-gray-100);
}

.prompts-row:first-of-type {
  border-top: none;
}

.prompt-info h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-gray-900);
}

.prompt-info p {
  font-size: var(--text-sm);
  color: var(--color-gray-500);
  margin-top: 0.25rem;
}

.prompt-status {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
}

.prompt-edit {
  font-size: var(--text-sm);
  color: var(--color-gray-900);
  justify-self: flex-start;
  border-bottom: 1px solid transparent;
  padding-bottom: 0.1rem;
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action {
  padding: 0.45rem 0.9rem;
  border: 1px solid var(--color-gray-900);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.danger {
  background-color: var(--color-white);
  color: var(--color-red-600, #dc2626);
  border-color: var(--color-red-600, #dc2626);
}

.prompt-edit:hover,
.prompt-edit:focus-visible {
  border-color: var(--color-gray-800);
}

@media (max-width: 960px) {
  .prompts-card__header,
  .prompts-row {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .prompts-card__header {
    display: none;
  }

  .prompts-row {
    gap: 0.75rem;
  }

  .prompt-status,
  .prompt-edit {
    justify-self: flex-start;
  }
}
</style>
