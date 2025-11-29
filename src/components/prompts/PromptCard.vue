<template>
  <Card
    class="prompt-card-minimal"
    :class="{ 'is-list-view': viewMode === 'list' }"
    @click="$emit('click', $event)"
  >
    <div class="card-content-wrapper">
      <!-- Left Column (List View) / Header (Grid View) -->
      <div class="card-section-primary">
        <h3 class="card-title">{{ prompt.title }}</h3>
        <Badge variant="default" rounded class="category-badge">{{ prompt.category }}</Badge>
      </div>

      <!-- Middle Column (List View) / Body (Grid View) -->
      <div class="card-section-main">
        <div
          v-if="prompt.imageUrl || (prompt.images && prompt.images.length > 0)"
          class="card-image-wrapper"
        >
          <img
            :src="prompt.images?.[0] || prompt.imageUrl"
            :alt="prompt.title"
            :title="prompt.title"
            class="card-image"
            loading="lazy"
          />
        </div>
        <p class="card-description">{{ prompt.description }}</p>
        <div class="prompt-preview">
          <code class="prompt-text">{{ prompt.prompt }}</code>
        </div>
        <!-- Tags only visible in grid view or if space permits -->
        <div v-if="viewMode === 'grid'" class="card-tags">
          <span v-for="tag in prompt.tags" :key="tag" class="minimal-tag">#{{ tag }}</span>
        </div>
      </div>

      <!-- Right Column (List View) / Footer (Grid View) -->
      <div class="card-section-actions">
        <div class="card-footer-left">
          <div v-if="prompt.author" class="author-info">
            <img
              v-if="prompt.author.avatarUrl"
              :src="prompt.author.avatarUrl"
              :alt="prompt.author.username"
              class="author-avatar"
            />
            <div v-else class="author-avatar-placeholder">
              {{ prompt.author.username.charAt(0).toUpperCase() }}
            </div>
            <span class="author-name">{{ prompt.author.username }}</span>
          </div>
          <span v-if="prompt.author" class="separator">•</span>
          <span class="date">{{ formatDate(prompt.createdAt) }}</span>
        </div>

        <div class="action-buttons">
          <Button
            :variant="isFavorite ? 'primary' : 'ghost'"
            size="sm"
            class="action-btn"
            :class="{ 'is-active': isFavorite }"
            @click.stop="toggleFavorite"
          >
            <Icon name="bookmark" :size="16" :class="{ 'icon-filled': isFavorite }" />
          </Button>
          <Button
            :variant="isCopied ? 'primary' : 'ghost'"
            size="sm"
            class="action-btn"
            :class="{ 'is-active': isCopied }"
            @click.stop="copyToClipboard"
          >
            <Icon name="copy" :size="16" />
          </Button>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Prompt } from '@/types/prompt'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import Icon from '@/components/ui/Icon.vue'
import { useToast } from '@/composables/useToast'
import { favoritesService } from '@/services/favorites'

interface Props {
  prompt: Prompt
  viewMode?: 'grid' | 'list'
}

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'grid',
})
const { t } = useI18n()
const isCopied = ref(false)
const isFavorite = ref(false)
const { success, error } = useToast()

onMounted(() => {
  isFavorite.value = favoritesService.isFavorite(props.prompt.id)
})

function toggleFavorite() {
  const newState = favoritesService.toggleFavorite(props.prompt.id)
  isFavorite.value = newState
  if (newState) {
    success(t('common.actions.saved'))
  } else {
    success(t('common.actions.unsaved'))
  }
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

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  } catch (e) {
    return dateString
  }
}
</script>

<style scoped>
/* Base Styles (Grid View Default) */
.prompt-card-minimal {
  height: 100%;
  transition: all 0.2s ease;
}

.prompt-card-minimal:hover {
  border-color: var(--color-primary-subtle);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1rem;
}

/* Primary Section: Title & Badge */
.card-section-primary {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.card-title {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.3;
}

.category-badge {
  flex-shrink: 0;
}

/* Main Section: Desc & Preview */
.card-section-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-image-wrapper {
  width: 100%;
  aspect-ratio: 9/16;
  height: auto;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-surface-alt);
  margin-bottom: 0.75rem;
  position: relative;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}

.card-description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prompt-preview {
  background-color: var(--color-surface-alt);
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
}

.prompt-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-xs);
  color: var(--color-text-primary);
  white-space: pre-wrap;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: auto;
}

.minimal-tag {
  font-size: 0.7rem;
  color: var(--color-text-tertiary);
  background: var(--color-surface-alt);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

/* Actions Section */
.card-section-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border-light);
  margin-top: auto;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  color: var(--color-text-secondary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: var(--radius-md);
}

.action-btn:hover {
  color: var(--color-primary);
  background: var(--color-primary-subtle);
  transform: translateY(-1px);
}

.action-btn.is-active {
  color: var(--color-primary);
  background: var(--color-primary-subtle);
  font-weight: 500;
}

.action-btn:active {
  transform: scale(0.95);
}

.btn-text {
  font-size: var(--text-xs);
}

.icon-filled {
  fill: currentColor;
}

.source-link {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: color 0.2s;
}

.source-link:hover {
  color: var(--color-primary);
}

/* --- List View Overrides --- */
.prompt-card-minimal.is-list-view {
  height: auto;
}

.prompt-card-minimal.is-list-view .card-content-wrapper {
  display: grid;
  grid-template-columns: 200px 1fr 100px; /* Left, Middle, Right */
  gap: 2rem;
  align-items: start;
}

/* Left Column */
.prompt-card-minimal.is-list-view .card-section-primary {
  flex-direction: column;
  gap: 0.75rem;
}

.prompt-card-minimal.is-list-view .card-title {
  font-size: var(--text-lg);
}

/* Middle Column */
.prompt-card-minimal.is-list-view .card-section-main {
  gap: 1rem;
}

.prompt-card-minimal.is-list-view .card-description {
  -webkit-line-clamp: 1; /* Single line description in list view */
}

.prompt-card-minimal.is-list-view .prompt-preview {
  background: var(--color-surface-alt);
  border: none; /* Cleaner look */
  padding: 1rem;
}

.prompt-card-minimal.is-list-view .prompt-text {
  -webkit-line-clamp: 3;
}

/* Right Column */
.prompt-card-minimal.is-list-view .card-section-actions {
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 1rem;
  border-top: none;
  padding-top: 0;
  height: 100%;
}

.prompt-card-minimal.is-list-view .copy-btn {
  width: 100%;
}

/* Responsive adjustments for list view on smaller screens */
@media (max-width: 768px) {
  .prompt-card-minimal.is-list-view .card-content-wrapper {
    grid-template-columns: 1fr; /* Stack vertically on mobile */
    gap: 1rem;
  }

  .prompt-card-minimal.is-list-view .card-section-primary {
    flex-direction: row;
    align-items: center;
  }

  .prompt-card-minimal.is-list-view .card-section-actions {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
}

.card-footer-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.author-avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
}

.author-avatar-placeholder {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
}

.author-name {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.separator {
  color: var(--color-border);
}

.date {
  color: var(--color-text-tertiary);
}
</style>
