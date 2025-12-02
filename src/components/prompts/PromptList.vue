<template>
  <div class="prompt-list">
    <div v-if="!loading && !error" class="list-controls">
      <div class="controls-left">
        <SortDropdown
          v-model="sortKey"
          :label="t('common.sort.sortBy')"
          :options="[
            { label: t('common.sort.title'), value: 'title' },
            { label: t('common.sort.createdAt'), value: 'createdAt' },
            { label: t('common.sort.updatedAt'), value: 'updatedAt' },
          ]"
        />
        <SortDropdown
          v-model="sortDir"
          :label="t('common.sort.order')"
          :options="[
            { label: t('common.sort.asc'), value: 'asc' },
            { label: t('common.sort.desc'), value: 'desc' },
          ]"
        />
        <SortDropdown
          v-model="pageSize"
          :label="t('common.sort.show')"
          :options="[
            { label: `12 ${t('common.sort.items')}`, value: 12 },
            { label: `24 ${t('common.sort.items')}`, value: 24 },
            { label: `48 ${t('common.sort.items')}`, value: 48 },
          ]"
        />
      </div>
      <div class="controls-right">
        <ViewToggle v-model="viewMode" />
        <div v-if="totalPages > 1" class="pagination-controls">
          <button class="pager" :disabled="currentPage === 1" @click="goPrev">
            {{ t('common.pagination.prev') }}
          </button>
          <span class="page-info">{{
            t('common.pagination.pageInfo', { current: currentPage, total: totalPages })
          }}</span>
          <button class="pager" :disabled="currentPage === totalPages" @click="goNext">
            {{ t('common.pagination.next') }}
          </button>
        </div>
      </div>
    </div>
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>{{ t('common.status.loading') }}</p>
    </div>

    <div v-else-if="error" class="error">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>{{ error }}</p>
      <button class="retry-button" @click="retry">Retry</button>
    </div>

    <div v-else-if="sortedPrompts.length === 0" class="empty">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <h3>{{ t('prompts.noPrompts') }}</h3>
      <p>{{ t('prompts.noPromptsDesc') }}</p>
    </div>

    <div v-else class="prompt-container" :class="viewMode">
      <PromptCard
        v-for="prompt in pagedPrompts"
        :key="prompt.id"
        :prompt="prompt"
        :view-mode="viewMode"
        @click="$emit('select', prompt)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Prompt } from '@/types/prompt'
import PromptCard from './PromptCard.vue'
import ViewToggle from '@/components/ui/ViewToggle.vue'
import SortDropdown from '@/components/ui/SortDropdown.vue'

interface Props {
  prompts: Prompt[]
  loading?: boolean
  error?: string | null
}

interface Emits {
  (e: 'retry'): void
  (e: 'select', prompt: Prompt): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
})

const { t } = useI18n()
const emit = defineEmits<Emits>()

const sortKey = ref<'title' | 'createdAt' | 'updatedAt'>('createdAt')
const sortDir = ref<'asc' | 'desc'>('desc')
const pageSize = ref<number>(12)
const currentPage = ref<number>(1)
const viewMode = ref<'grid' | 'list'>('grid')

const normalizedDate = (v?: string) => {
  if (!v) return 0
  const t = Date.parse(v)
  return Number.isNaN(t) ? 0 : t
}

const sortedPrompts = computed(() => {
  const base = [...props.prompts]
  return base.sort((a, b) => {
    let av = ''
    let bv = ''
    if (sortKey.value === 'title') {
      av = a.title || ''
      bv = b.title || ''
      const cmp = av.localeCompare(bv)
      return sortDir.value === 'asc' ? cmp : -cmp
    }
    if (sortKey.value === 'createdAt') {
      const cmp = normalizedDate(a.createdAt) - normalizedDate(b.createdAt)
      return sortDir.value === 'asc' ? cmp : -cmp
    }
    const cmp = normalizedDate(a.updatedAt) - normalizedDate(b.updatedAt)
    return sortDir.value === 'asc' ? cmp : -cmp
  })
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedPrompts.value.length / pageSize.value)),
)
const pagedPrompts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedPrompts.value.slice(start, start + pageSize.value)
})

watch([sortKey, sortDir, pageSize, () => props.prompts], () => {
  currentPage.value = 1
})

function goPrev() {
  if (currentPage.value > 1) currentPage.value -= 1
}

function goNext() {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

function retry() {
  emit('retry')
}
onMounted(() => {
  try {
    const saved = Number(localStorage.getItem('prompt-hub::pref::pageSize'))
    if (!Number.isNaN(saved) && saved > 0) {
      pageSize.value = saved
    }
  } catch {
    // ignore
  }
})
</script>

<style scoped>
.prompt-list {
  width: 100%;
}

.list-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background-color: transparent;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.controls-left {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.controls-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
}

@media (max-width: 640px) {
  .list-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .controls-left {
    width: 100%;
    justify-content: space-between;
  }

  .controls-left > * {
    flex: 1;
  }

  .controls-right {
    width: 100%;
    justify-content: space-between;
    margin-left: 0;
  }

  .prompt-container.grid {
    grid-template-columns: 1fr;
  }
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pager {
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all 0.2s;
}

.pager:hover:not(:disabled) {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.pager:disabled {
  opacity: 0.5;
}

.page-info {
  font-size: var(--text-sm);
  color: var(--color-gray-700);
}

.loading,
.error,
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  background-color: var(--color-white);
  border-radius: 8px;
  border: 2px dashed var(--color-gray-300);
  min-height: 400px;
}

.loading {
  gap: 1.5rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-gray-200);
  border-top-color: var(--color-gray-900);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading p {
  margin: 0;
  font-size: 1rem;
  color: var(--color-gray-600);
  font-weight: 500;
}

.error {
  gap: 1.5rem;
  color: var(--color-gray-700);
}

.error svg {
  color: var(--color-gray-400);
}

.error p {
  margin: 0;
  font-size: 1rem;
  color: var(--color-gray-600);
}

.retry-button {
  margin-top: 0.5rem;
  padding: 0.625rem 1.5rem;
  background-color: var(--color-gray-900);
  color: var(--color-white);
  border: none;
  border-radius: 6px;
  font-size: 0.938rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background-color: var(--color-gray-800);
  transform: translateY(-1px);
}

.retry-button:active {
  transform: translateY(0);
}

.empty {
  gap: 1rem;
  color: var(--color-gray-600);
}

.empty svg {
  color: var(--color-gray-300);
}

.empty h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-gray-900);
}

.empty p {
  margin: 0;
  font-size: 1rem;
  color: var(--color-gray-600);
  max-width: 400px;
}

.prompt-container.grid {
  display: block; /* Masonry layout uses block display with columns */
  column-count: 4;
  column-gap: 1.5rem;
}

.prompt-container.grid > * {
  break-inside: avoid;
  margin-bottom: 1.5rem;
  /* Ensure card width is 100% of column */
  width: 100%;
}

.prompt-container.list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 1400px) {
  .prompt-container.grid {
    column-count: 3;
  }
}

@media (max-width: 1024px) {
  .prompt-container.grid {
    column-count: 2;
  }
}

@media (max-width: 640px) {
  .prompt-container.grid {
    column-count: 1;
  }

  .loading,
  .error,
  .empty {
    padding: 3rem 1.5rem;
    min-height: 300px;
  }
}
</style>
