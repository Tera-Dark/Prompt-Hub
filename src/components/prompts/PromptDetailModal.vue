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
                <div class="main-image-wrapper">
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

                  <!-- Download Button -->
                  <button
                    class="download-btn"
                    title="Download original image"
                    @click.stop="downloadCurrentImage"
                  >
                    <Icon name="download" :size="20" />
                  </button>
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
                <div class="header-top">
                  <Badge variant="default" rounded>{{ prompt.category }}</Badge>
                  <div class="meta-info">
                    <!-- Metrics temporarily removed -->
                  </div>
                </div>
                <h2 class="modal-title">{{ prompt.title }}</h2>
                <p class="modal-description">{{ prompt.description }}</p>
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
                <a
                  v-if="prompt.sourceLink"
                  :href="prompt.sourceLink"
                  target="_blank"
                  class="source-link"
                >
                  {{ t('common.actions.source') }} <Icon name="external-link" :size="14" />
                </a>
              </div>
            </div>
          </div>
        </div>
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
  max-width: 1100px;
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
  grid-template-columns: 45% 55%;
  min-height: 500px;
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
  aspect-ratio: 1/1; /* Keep images square-ish or flexible */
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: contain; /* Show full image without cropping */
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

.download-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-primary);
  transition: all 0.2s;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 5;
}

.download-btn:hover {
  background: white;
  transform: scale(1.1);
  color: var(--color-primary);
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
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  max-height: 80vh; /* Ensure scrolling within the panel if content is long */
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

.modal-title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.modal-description {
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.prompt-content-box {
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
  margin-top: auto; /* Push to bottom if space permits */
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
  max-height: 300px; /* Limit height of code block */
  overflow-y: auto;
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

@media (max-width: 768px) {
  .modal-grid {
    grid-template-columns: 1fr;
  }

  .image-gallery-section {
    border-right: none;
    border-bottom: 1px solid var(--color-border-light);
    padding: 1rem;
  }

  .content-section {
    padding: 1.5rem;
    max-height: none;
  }

  .main-image-wrapper {
    aspect-ratio: 16/9;
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
