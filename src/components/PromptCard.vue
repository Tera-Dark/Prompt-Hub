<template>
  <Card class="prompt-card-modern">
    <template #header>
      <div class="card-header-content">
        <h3 class="card-title">{{ prompt.title }}</h3>
        <Badge variant="primary" rounded>{{ prompt.category }}</Badge>
      </div>
    </template>

    <p class="card-description">{{ prompt.description }}</p>

    <div class="prompt-preview">
      <code class="prompt-text">{{ prompt.prompt }}</code>
    </div>

    <div class="card-tags">
      <Badge v-for="tag in prompt.tags" :key="tag" variant="default">{{ tag }}</Badge>
    </div>

    <template #footer>
      <div class="card-actions">
        <Button
          :variant="isCopied ? 'success' : 'secondary'"
          size="sm"
          class="copy-btn"
          @click="copyToClipboard"
        >
          <template #icon-left>
            <span v-if="isCopied">✓</span>
            <span v-else>📋</span>
          </template>
          {{ isCopied ? 'Copied!' : 'Copy' }}
        </Button>

        <a
          v-if="prompt.sourceLink"
          :href="prompt.sourceLink"
          target="_blank"
          rel="noopener noreferrer"
          class="source-link"
        >
          Source ↗
        </a>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Prompt } from '@/types/prompt'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import { useToast } from '@/composables/useToast'

interface Props {
  prompt: Prompt
}

const props = defineProps<Props>()
const isCopied = ref(false)
const { success, error } = useToast()

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(props.prompt.prompt)
    isCopied.value = true
    success('Prompt copied to clipboard!')
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
    error('Failed to copy prompt')
  }
}
</script>

<style scoped>
.prompt-card-modern {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.card-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.4;
}

.card-description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prompt-preview {
  background-color: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  margin-bottom: 1rem;
  max-height: 120px;
  overflow-y: auto;
}

.prompt-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  white-space: pre-wrap;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: auto;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.source-link {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  transition: color var(--transition-base);
}

.source-link:hover {
  color: var(--color-primary);
}
</style>
