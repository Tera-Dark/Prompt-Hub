<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <button class="close-btn" @click="close">
          <Icon name="x" :size="24" />
        </button>

        <div class="modal-body">
          <div class="modal-grid">
            <!-- Left Column: Image Gallery -->
            <div v-if="allImages.length > 0" class="image-gallery-section">
              <div class="gallery-container">
                <div class="main-image-wrapper" @dblclick="openZoom">
                  <img :src="allImages[currentImageIndex]" :alt="prompt.title" class="main-image" />

                  <!-- Navigation Arrows -->
                  <button
                    v-if="allImages.length > 1"
                    class="nav-btn prev"
                    :disabled="currentImageIndex === 0"
                    @click.stop="prevImage"
                  >
                    <Icon name="chevron-left" :size="24" />
                  </button>
                  <button
                    v-if="allImages.length > 1"
                    class="nav-btn next"
                    :disabled="currentImageIndex === allImages.length - 1"
                    @click.stop="nextImage"
                  >
                    <Icon name="chevron-right" :size="24" />
                  </button>

                  <div class="zoom-hint">
                    {{ t('imageUploader.doubleClickZoom') || '双击查看大图' }}
                  </div>
                </div>

                <!-- Thumbnails/Dots -->
                <div v-if="allImages.length > 1" class="gallery-indicators">
                  <button
                    v-for="(_, index) in allImages"
                    :key="index"
                    class="indicator-dot"
                    :class="{ active: currentImageIndex === index }"
                    @click="currentImageIndex = index"
                  ></button>
                </div>
              </div>
            </div>
            <div v-else class="image-placeholder-section">
              <div class="no-image">
                <Icon name="image" :size="48" class="text-gray-300" />
              </div>
            </div>

            <!-- Right Column: Content -->
            <div class="content-section">
              <div class="modal-header">
                <div class="title-row">
                  <h2 class="modal-title">{{ prompt.title }}</h2>
                  <div class="header-actions-top">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Download"
                      @click="downloadCurrentImage"
                    >
                      <Icon name="download" :size="20" />
                    </Button>
                  </div>
                </div>

                <div class="header-meta">
                  <Badge variant="default" rounded class="category-badge">{{
                    prompt.category
                  }}</Badge>

                  <div class="meta-separator"></div>

                  <div v-if="prompt.author" class="author-info">
                    <div class="author-avatar-placeholder">
                      {{ prompt.author.username.charAt(0).toUpperCase() }}
                    </div>
                    <span class="author-name">{{ prompt.author.username }}</span>
                  </div>

                  <span class="meta-dot">·</span>
                  <span class="date">{{ new Date(prompt.createdAt).toLocaleDateString() }}</span>
                </div>
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

              <div v-if="prompt.description" class="description-section">
                <p class="modal-description">{{ prompt.description }}</p>
              </div>

              <div class="modal-footer">
                <div class="tags-list">
                  <span v-for="tag in prompt.tags" :key="tag" class="tag">#{{ tag }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Zoom Modal -->
    <div v-if="zoomedImage" class="zoom-modal" @click="closeZoom">
      <div class="zoom-backdrop"></div>
      <div class="zoom-content">
        <img :src="zoomedImage" alt="Zoomed image" />
        <button class="zoom-close" @click="closeZoom">
          <Icon name="x" :size="24" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Prompt } from '@/types/prompt'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import Icon from '@/components/ui/Icon.vue'
import { useToast } from '@/composables/useToast'
import { favoritesService } from '@/services/favorites'
import { useScrollLock } from '@/composables/useScrollLock'

const props = defineProps<{
  isOpen: boolean
  prompt: Prompt
}>()

const emit = defineEmits(['close'])
const { t } = useI18n()
const { success, error } = useToast()

const isCopied = ref(false)
const isFavorite = ref(false)
const currentImageIndex = ref(0)
const zoomedImage = ref<string | null>(null)

const isOpenRef = computed(() => props.isOpen)
useScrollLock(isOpenRef)

const allImages = computed(() => {
  if (props.prompt.images && props.prompt.images.length > 0) {
    return props.prompt.images
  }
  if (props.prompt.imageUrl) {
    return [props.prompt.imageUrl]
  }
  return []
})

function nextImage() {
  if (currentImageIndex.value < allImages.value.length - 1) {
    currentImageIndex.value++
  }
}

function prevImage() {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

function openZoom() {
  const url = allImages.value[currentImageIndex.value]
  if (url) {
    zoomedImage.value = url
  }
}

function closeZoom() {
  zoomedImage.value = null
}

async function downloadCurrentImage() {
  const url = allImages.value[currentImageIndex.value]
  if (!url) return

  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)

    // Generate filename from URL or title
    const ext = url.split('.').pop()?.split(/[?#]/)[0] || 'png'
    const filename = `${props.prompt.title.replace(/[^a-z0-9]/gi, '_')}-${currentImageIndex.value + 1}.${ext}`

    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    success(t('common.actions.downloaded') || 'Download started')
  } catch (err) {
    console.error('Download failed:', err)
    error('Failed to download image')
    // Fallback
    window.open(url, '_blank')
  }
}

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      isFavorite.value = favoritesService.isFavorite(props.prompt.id)
      currentImageIndex.value = 0
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
    success(t('common.actions.unsaved'))
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
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 1200px; /* Increased width */
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  box-shadow: var(--shadow-xl);
  animation: modal-in 0.2s ease-out;
  display: flex;
  flex-direction: column;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s;
  z-index: 20;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.close-btn:hover {
  background: var(--color-surface);
  color: var(--color-text-primary);
  transform: scale(1.1);
}

.modal-body {
  padding: 0;
  overflow-y: auto;
  height: 100%;
}

.modal-grid {
  display: grid;
  grid-template-columns: 55% 45%; /* Adjusted ratio for larger image */
  min-height: 600px; /* Increased min-height */
}

/* Left Column: Gallery */
.image-gallery-section {
  background: var(--color-surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  border-right: 1px solid var(--color-border-light);
}

.gallery-container {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.main-image-wrapper {
  position: relative;
  width: 100%;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  aspect-ratio: auto;
  max-height: 70vh; /* Increased max-height */
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-in;
}

.main-image {
  width: 100%;
  height: 100%;
  max-height: 70vh; /* Increased max-height */
  object-fit: contain;
  display: block;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-primary);
  transition: all 0.2s;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-btn:not(:disabled):hover {
  background: white;
  transform: translateY(-50%) scale(1.1);
}

.nav-btn.prev {
  left: 1rem;
}

.nav-btn.next {
  right: 1rem;
}

.zoom-hint {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  text-align: center;
  padding: 0.5rem;
  font-size: var(--text-xs);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.main-image-wrapper:hover .zoom-hint {
  opacity: 1;
}

.gallery-indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-border);
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s;
}

.indicator-dot.active {
  background: var(--color-primary);
  transform: scale(1.2);
}

.image-placeholder-section {
  background: var(--color-surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid var(--color-border-light);
}

/* Right Column: Content */
.content-section {
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  overflow-y: auto;
  max-height: 90vh;
}

.modal-header {
  margin-bottom: 1.5rem;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.header-actions-top {
  display: flex;
  gap: 0.5rem;
  padding-right: 2rem; /* Space for close button */
}

.modal-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: var(--text-sm);
}

.category-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  background-color: var(--color-surface-alt);
  color: var(--color-text-secondary);
  font-weight: 600;
}

.meta-separator {
  width: 1px;
  height: 16px;
  background-color: var(--color-border);
  margin: 0 0.25rem;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-secondary);
}

.author-avatar-placeholder {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--color-primary-subtle);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.author-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.meta-dot {
  color: var(--color-text-tertiary);
  font-weight: bold;
}

.date {
  color: var(--color-text-tertiary);
}

.prompt-content-box {
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  border: none;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: transparent;
}

.prompt-text {
  padding: 1.25rem;
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.925rem;
  line-height: 1.7;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  overflow-x: auto;
  max-height: 300px;
  background: transparent;
}

.description-section {
  margin-top: 0;
  color: var(--color-text-secondary);
}

.modal-description {
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
}

.modal-footer {
  margin-top: auto;
  padding-top: 1.5rem;
  border-top: none;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  background: var(--color-surface-alt);
  padding: 0.35rem 0.85rem;
  border-radius: 2rem;
  font-weight: 500;
  transition: all 0.2s;
}

.tag:hover {
  background: var(--color-border-light);
  color: var(--color-text-primary);
}

/* Zoom Modal */
.zoom-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
}

.zoom-content {
  position: relative;
  max-width: 95vw;
  max-height: 95vh;
  z-index: 10000;
}

.zoom-content img {
  max-width: 100%;
  max-height: 95vh;
  object-fit: contain;
  border-radius: var(--radius-lg);
}

.zoom-close {
  position: absolute;
  top: -40px;
  right: 0;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.9);
  color: black;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.zoom-close:hover {
  background: white;
}

@media (max-width: 768px) {
  .modal-grid {
    grid-template-columns: 1fr;
  }

  .image-gallery-section {
    border-right: none;
    border-bottom: 1px solid var(--color-border-light);
    padding: 0;
    background: #000;
  }

  .gallery-container {
    gap: 0;
  }

  .main-image-wrapper {
    border-radius: 0;
    box-shadow: none;
    max-height: 400px;
    background: transparent;
  }

  .main-image {
    max-height: 400px;
  }

  .content-section {
    padding: 1.5rem;
    max-height: none;
  }
}

@media (max-width: 640px) {
  .modal-content {
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-overlay {
    padding: 0;
  }
}
</style>
