<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <button class="close-btn" @click="close">
        <Icon name="x" :size="24" />
      </button>

      <div class="modal-body">
        <div class="modal-header">
          <div class="header-top">
            <Badge variant="default" rounded>{{ prompt.category }}</Badge>
            <div class="meta-info">
              <!-- Metrics temporarily removed -->
            </div>
          </div>
          <h2 class="modal-title">{{ prompt.title }}</h2>
          <p class="modal-description">{{ prompt.description }}</p>
        </div>

        <div v-if="prompt.imageUrl" class="modal-image-container">
          <img :src="prompt.imageUrl" :alt="prompt.title" class="modal-image" />
        </div>

        <div class="prompt-content-box">
          <div class="box-header">
            <span class="box-label">Prompt</span>
            <div class="actions-group">
              <Button
                :variant="isFavorite ? 'primary' : 'outline'"
                size="sm"
                @click="toggleFavorite"
              >
                <Icon name="bookmark" :size="14" />
                {{ isFavorite ? t('common.actions.saved') : t('common.actions.save') }}
              </Button>
              <Button variant="outline" size="sm" @click="copyToClipboard">
                <Icon name="copy" :size="14" />
                {{ isCopied ? t('common.actions.copied') : t('common.actions.copy') }}
              </Button>
            </div>
          </div>
          <pre class="prompt-text">{{ prompt.prompt }}</pre>
        </div>

        <div class="modal-footer">
          <div class="tags-list">
            <span v-for="tag in prompt.tags" :key="tag" class="tag">#{{ tag }}</span>
          </div>
          <a v-if="prompt.sourceLink" :href="prompt.sourceLink" target="_blank" class="source-link">
            {{ t('common.actions.source') }} <Icon name="external-link" :size="14" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Prompt } from '@/types/prompt'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import Icon from '@/components/ui/Icon.vue'
import { useToast } from '@/composables/useToast'
import { favoritesService } from '@/services/favorites'

const props = defineProps<{
  isOpen: boolean
  prompt: Prompt
}>()

const emit = defineEmits(['close'])
const { t } = useI18n()
const { success, error } = useToast()

const isCopied = ref(false)
const isFavorite = ref(false)

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      isFavorite.value = favoritesService.isFavorite(props.prompt.id)
    }
  },
  { immediate: true },
)

function toggleFavorite() {
  const newState = favoritesService.toggleFavorite(props.prompt.id)
  isFavorite.value = newState
  if (newState) {
    success(t('common.actions.saved'))
  } else {
    success(t('common.actions.unsaved')) // Or just 'Removed from favorites'
  }
}

function close() {
  emit('close')
}

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

// Lock body scroll when modal is open
watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  },
)
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  padding: 1rem;
}

.modal-content {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: var(--shadow-xl);
  animation: modal-in 0.3s ease-out;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0.5rem;
  border-radius: 50%;
  transition: background 0.2s;
  z-index: 10;
}

.close-btn:hover {
  background: var(--color-surface-alt);
  color: var(--color-text-primary);
}

.modal-body {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.meta-info {
  display: flex;
  gap: 1rem;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.modal-title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 0.5rem 0;
}

.modal-description {
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.modal-image-container {
  width: 100%;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-surface-alt);
}

.modal-image {
  width: 100%;
  height: auto;
  display: block;
  max-height: 400px;
  object-fit: cover;
}

.prompt-content-box {
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
}

.box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border-light);
  background: rgba(0, 0, 0, 0.02);
}

.actions-group {
  display: flex;
  gap: 0.5rem;
}

.box-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.prompt-text {
  padding: 1.5rem;
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  overflow-x: auto;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-light);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  font-size: var(--text-sm);
  color: var(--color-primary);
  background: var(--color-primary-subtle);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
}

.source-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--text-sm);
  transition: color 0.2s;
}

.source-link:hover {
  color: var(--color-primary);
}

@media (max-width: 640px) {
  .modal-body {
    padding: 1.5rem;
  }

  .modal-title {
    font-size: var(--text-xl);
  }
}
</style>
