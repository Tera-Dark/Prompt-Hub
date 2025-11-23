<template>
  <Card class="prompt-card-minimal">
    <template #header>
      <div class="card-header-content">
        <div class="title-row">
          <h3 class="card-title">{{ prompt.title }}</h3>
          <Badge variant="default" rounded>{{ prompt.category }}</Badge>
        </div>
      </div>
    </template>

    <p class="card-description">{{ prompt.description }}</p>

    <div class="prompt-preview">
      <code class="prompt-text">{{ prompt.prompt }}</code>
    </div>

    <div class="card-tags">
      <span v-for="tag in prompt.tags" :key="tag" class="minimal-tag">#{{ tag }}</span>
    </div>

    <template #footer>
      <div class="card-actions">
        <Button
          :variant="isCopied ? 'primary' : 'outline'"
          size="sm"
          class="copy-btn"
          @click="copyToClipboard"
        >
          {{ isCopied ? 'Copied' : 'Copy' }}
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
    success('Copied to clipboard')
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
    error('Failed to copy')
  }
}
</script>

<style scoped>
.prompt-card-minimal {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header-content {
  width: 100%;
}

.title-row {
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
  line-height: 1.3;
}

.card-description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prompt-preview {
  background-color: var(--color-surface-alt);
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: var(--radius-sm);
  max-height: 120px;
  overflow-y: auto;
  border: 1px solid transparent; /* Placeholder for potential border */
}

.prompt-text {
  font-family: 'JetBrains Mono', monospace; /* Or system monospace */
  font-size: var(--text-xs);
  color: var(--color-text-primary);
  white-space: pre-wrap;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: auto;
  margin-bottom: 0.5rem;
}

.minimal-tag {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.source-link {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.source-link:hover {
  color: var(--color-text-primary);
}
</style>
