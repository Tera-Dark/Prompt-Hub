<template>
  <div class="prompt-list">
    <div v-if="!loading && !error" class="list-controls">
      <div class="controls-left">
        <label class="control">
          <span>排序</span>
          <select v-model="sortKey">
            <option value="title">标题</option>
            <option value="createdAt">创建时间</option>
            <option value="updatedAt">更新时间</option>
          </select>
        </label>
        <label class="control">
          <span>方向</span>
          <select v-model="sortDir">
            <option value="asc">升序</option>
            <option value="desc">降序</option>
          </select>
        </label>
        <label class="control">
          <span>每页</span>
          <select v-model.number="pageSize">
            <option :value="12">12</option>
            <option :value="24">24</option>
            <option :value="48">48</option>
          </select>
        </label>
      </div>
      <div class="controls-right" v-if="totalPages > 1">
        <button class="pager" :disabled="currentPage===1" @click="goPrev">上一页</button>
        <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
        <button class="pager" :disabled="currentPage===totalPages" @click="goNext">下一页</button>
      </div>
    </div>
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading prompts...</p>
    </div>

    <div v-else-if="error" class="error">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>{{ error }}</p>
      <button @click="retry" class="retry-button">Retry</button>
    </div>

    <div v-else-if="sortedPrompts.length === 0" class="empty">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <h3>No prompts found</h3>
      <p>Try adjusting your search or filters to find what you're looking for.</p>
    </div>

    <div v-else class="prompt-grid">
      <PromptCard 
        v-for="prompt in pagedPrompts" 
        :key="prompt.id" 
        :prompt="prompt"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { Prompt } from '@/types/prompt';
import PromptCard from './PromptCard.vue';

interface Props {
  prompts: Prompt[];
  loading?: boolean;
  error?: string | null;
}

interface Emits {
  (e: 'retry'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null
});

const emit = defineEmits<Emits>();

const sortKey = ref<'title'|'createdAt'|'updatedAt'>('title');
const sortDir = ref<'asc'|'desc'>('asc');
const pageSize = ref<number>(24);
const currentPage = ref<number>(1);

const normalizedDate = (v?: string) => {
  if (!v) return 0;
  const t = Date.parse(v);
  return Number.isNaN(t) ? 0 : t;
};

const sortedPrompts = computed(() => {
  const base = [...props.prompts];
  return base.sort((a, b) => {
    let av = '';
    let bv = '';
    if (sortKey.value === 'title') {
      av = a.title || '';
      bv = b.title || '';
      const cmp = av.localeCompare(bv);
      return sortDir.value === 'asc' ? cmp : -cmp;
    }
    if (sortKey.value === 'createdAt') {
      const cmp = normalizedDate(a.createdAt) - normalizedDate(b.createdAt);
      return sortDir.value === 'asc' ? cmp : -cmp;
    }
    const cmp = normalizedDate(a.updatedAt) - normalizedDate(b.updatedAt);
    return sortDir.value === 'asc' ? cmp : -cmp;
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(sortedPrompts.value.length / pageSize.value)));
const pagedPrompts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return sortedPrompts.value.slice(start, start + pageSize.value);
});

watch([sortKey, sortDir, pageSize, () => props.prompts], () => {
  currentPage.value = 1;
});

function goPrev() {
  if (currentPage.value > 1) currentPage.value -= 1;
}

function goNext() {
  if (currentPage.value < totalPages.value) currentPage.value += 1;
}

function retry() {
  emit('retry');
}
onMounted(() => {})
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
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.controls-left {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control span {
  font-size: var(--text-sm);
  color: var(--color-gray-700);
}

.control select {
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 6px;
  background-color: var(--color-white);
  font-size: var(--text-sm);
}

.controls-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pager {
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--color-gray-900);
  border-radius: 6px;
  background-color: var(--color-black);
  color: var(--color-white);
  font-size: var(--text-sm);
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

.prompt-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

@media (max-width: 768px) {
  .prompt-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .loading,
  .error,
  .empty {
    padding: 3rem 1.5rem;
    min-height: 300px;
  }
}

@media (min-width: 1400px) {
  .prompt-grid {
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  }
}
</style>
onMounted(() => {
  try {
    const saved = Number(localStorage.getItem('prompt-hub::pref::pageSize'))
    if (!Number.isNaN(saved) && saved > 0) pageSize.value = saved
  } catch {}
})
