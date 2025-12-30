<template>
  <Card
    class="prompt-card-minimal"
    :class="{ 'is-list-view': viewMode === 'list' }"
    @click="$emit('click', $event)"
  >
    <div class="card-content-wrapper">
      <!-- Image Cover (Grid View: Top, List View: Left) -->
      <div v-if="prompt.imageUrl || (prompt.images && prompt.images.length > 0)" class="card-cover">
        <AsyncImage
          :src="prompt.images?.[0] || prompt.imageUrl"
          :alt="prompt.title"
          img-class="card-image"
        />
        <!-- Overlay Actions (Grid Only) -->
        <div v-if="viewMode === 'grid'" class="card-overlay">
          <Button
            :variant="isCopied ? 'primary' : 'secondary'"
            size="sm"
            class="overlay-btn"
            @click.stop="copyToClipboard"
          >
            <Icon name="copy" :size="16" />
            {{ isCopied ? t('common.actions.copied') : t('common.actions.copy') }}
          </Button>
          <Button
            :variant="isFavorite ? 'primary' : 'secondary'"
            size="sm"
            class="overlay-btn icon-only"
            @click.stop="toggleFavorite"
          >
            <Icon name="bookmark" :size="16" :class="{ 'icon-filled': isFavorite }" />
          </Button>
        </div>
      </div>

      <!-- Content Body -->
      <div class="card-body">
        <div class="card-header">
          <h3 class="card-title">{{ prompt.title }}</h3>
          <Badge variant="default" size="sm" class="category-badge">{{ prompt.category }}</Badge>
        </div>

        <p class="card-description line-clamp-2">{{ prompt.description }}</p>

        <!-- List View: Prompt Preview -->
        <div v-if="viewMode === 'list'" class="prompt-preview">
          <code class="prompt-text">{{ prompt.prompt }}</code>
        </div>

        <!-- Grid View: Minimal Footer -->
        <div class="card-footer">
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

          <!-- List View: Actions in footer -->
          <div v-if="viewMode === 'list'" class="list-actions">
            <!-- Re-implement list actions if needed, or keep simple -->
            <Button size="sm" variant="ghost" @click.stop="copyToClipboard">
              <Icon name="copy" :size="16" />
            </Button>
            <Button size="sm" variant="ghost" @click.stop="toggleFavorite">
              <Icon name="bookmark" :size="16" :class="{ 'icon-filled': isFavorite }" />
            </Button>
          </div>
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
import AsyncImage from '@/components/ui/AsyncImage.vue'
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
</script>

<style scoped>
/* Base Styles (Grid View Default) */
.prompt-card-minimal {
  height: 100%;
  transition: all 0.2s ease;
  overflow: hidden; /* For hover zoom effect */
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
}

/* --- Card Cover (Image) --- */
.card-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 3/4; /* Default aspect ratio, can be overridden by Masonry */
  overflow: hidden;
  background: var(--color-gray-100);
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.prompt-card-minimal:hover .card-image {
  transform: scale(1.05);
}

/* Overlay Actions */
.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 0.75rem;
  gap: 0.5rem;
}

.prompt-card-minimal:hover .card-overlay {
  opacity: 1;
}

.overlay-btn {
  backdrop-filter: blur(4px);
  background: rgba(255, 255, 255, 0.9) !important;
  color: var(--color-gray-900) !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.overlay-btn:hover {
  background: white !important;
  transform: scale(1.05);
}

.overlay-btn.icon-only {
  padding: 0.5rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* --- Card Body --- */
.card-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.card-title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0;
  line-height: 1.4;
}

.card-description {
  font-size: var(--text-sm);
  color: var(--color-gray-500);
  margin: 0;
  line-height: 1.5;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* --- Card Footer --- */
.card-footer {
  margin-top: auto;
  padding-top: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.author-avatar-placeholder {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.author-name {
  font-size: var(--text-xs);
  color: var(--color-gray-500);
  font-weight: 500;
}

/* --- List View Overrides --- */
.prompt-card-minimal.is-list-view {
  height: auto;
}

.prompt-card-minimal.is-list-view .card-content-wrapper {
  flex-direction: row;
  align-items: flex-start;
  gap: 0; /* Image handles its own margin if needed, or cover handles it */
}

.prompt-card-minimal.is-list-view .card-cover {
  width: 200px;
  height: auto; /* Let flex stretch it or fixed height */
  min-height: 160px; /* Minimum height for list view image */
  aspect-ratio: 4/3;
  flex-shrink: 0;
}

.prompt-card-minimal.is-list-view .card-body {
  padding: 1.5rem;
  gap: 0.75rem;
}

.prompt-card-minimal.is-list-view .card-header {
  justify-content: flex-start;
  align-items: center;
}

.prompt-card-minimal.is-list-view .card-title {
  font-size: var(--text-lg);
}

.prompt-card-minimal.is-list-view .prompt-preview {
  background: var(--color-gray-50);
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  margin-top: 0.5rem;
}

.prompt-card-minimal.is-list-view .prompt-text {
  font-family: monospace;
  font-size: var(--text-sm);
  color: var(--color-gray-700);
  white-space: pre-wrap;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prompt-card-minimal.is-list-view .card-footer {
  padding-top: 0;
  margin-top: 0.5rem;
}

.list-actions {
  display: flex;
  gap: 0.5rem;
}

/* Mobile List View */
@media (max-width: 640px) {
  .prompt-card-minimal.is-list-view .card-content-wrapper {
    flex-direction: column;
  }
  .prompt-card-minimal.is-list-view .card-cover {
    width: 100%;
    aspect-ratio: 16/9;
  }
}
</style>
