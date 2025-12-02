<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { uploadImage, uploadToImgur } from '../../services/image'

const props = defineProps<{
  modelValue: string[]
  limit?: number
  token: string
}>()

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const isDragging = ref(false)
const isUploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadQueue = ref<
  { id: string; url?: string; file?: File; progress: boolean; error?: string }[]
>([])
const zoomedImage = ref<string | null>(null)
const imageUrlInput = ref('')

const addImageFromUrl = () => {
  const url = imageUrlInput.value.trim()
  if (!url) return

  // Basic URL validation
  try {
    new URL(url)
    emit('update:modelValue', [url])
    imageUrlInput.value = ''
    console.log('✅ Added image from URL:', url)
  } catch (e) {
    alert('请输入有效的图片URL')
  }
}

const triggerSelect = () => {
  if (isUploading.value) return
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    await processFiles(Array.from(input.files))
  }
  input.value = '' // Reset
}

const handleDrop = async (event: DragEvent) => {
  if (isUploading.value) return
  isDragging.value = false
  if (event.dataTransfer?.files) {
    await processFiles(Array.from(event.dataTransfer.files))
  }
}

const processFiles = async (files: File[]) => {
  if (isUploading.value) return

  const isSingleMode = props.limit === 1

  // If single mode, we don't check remaining slots against length,
  // we just take the first file and replace everything.
  if (isSingleMode) {
    if (files.length === 0) return
    // Take only the first file
    const file = files[0]

    if (!file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) {
      alert(t('imageUploader.fileTooLarge', { name: file.name }))
      return
    }

    isUploading.value = true

    // Clear existing queue and model
    uploadQueue.value = []

    const id = Math.random().toString(36).substring(7)
    const item = { id, file, progress: true, url: '' }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      item.url = e.target?.result as string
    }

    uploadQueue.value = [item]

    try {
      const publicUrl = await uploadImage(item.file!, props.token)
      // Replace modelValue with just this new URL
      emit('update:modelValue', [publicUrl])
      uploadQueue.value = []
    } catch (e: any) {
      console.error('Upload error:', e)
      const qItem = uploadQueue.value.find((q) => q.id === item.id)

      if (qItem) {
        // Check if it's a permission error (404 on blob creation)
        const isPermissionError =
          e?.status === 404 ||
          e?.message?.includes('Not Found') ||
          e?.message?.includes('createBlob')

        if (isPermissionError) {
          console.warn('🔒 User lacks repository write permission. Falling back to Imgur.')
          try {
            const imgurUrl = await uploadToImgur(item.file!)
            emit('update:modelValue', [imgurUrl])
            uploadQueue.value = []
            isUploading.value = false
            return
          } catch (imgurError) {
            console.error('Imgur fallback failed:', imgurError)
            qItem.progress = false
            qItem.error = '上传失败 (GitHub无权限且图床失败)'
          }
        } else {
          qItem.progress = false
          qItem.error = t('imageUploader.uploadFailed') || 'Upload failed'
        }
      }
    } finally {
      isUploading.value = false
    }
    return
  }

  // Multi-image mode (existing logic)
  const remainingSlots = (props.limit || 9) - props.modelValue.length
  if (remainingSlots <= 0) {
    alert(t('imageUploader.limitReached'))
    return
  }

  const filesToUpload = files.slice(0, remainingSlots)
  const validFiles: File[] = []

  // Pre-check files
  for (const file of filesToUpload) {
    if (!file.type.startsWith('image/')) continue
    if (file.size > 10 * 1024 * 1024) {
      alert(t('imageUploader.fileTooLarge', { name: file.name }))
      continue
    }
    validFiles.push(file)
  }

  if (validFiles.length === 0) return

  isUploading.value = true

  // 1. Create queue items for all files immediately
  const queueItems = validFiles.map((file) => {
    const id = Math.random().toString(36).substring(7)
    const item = { id, file, progress: true, url: '' } // url will be set by FileReader

    // Create preview
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      item.url = e.target?.result as string
    }

    return item
  })

  uploadQueue.value.push(...queueItems)

  try {
    // 2. Upload SEQUENTIALLY to avoid race conditions on branch creation
    for (const item of queueItems) {
      if (!item.file) continue

      try {
        const publicUrl = await uploadImage(item.file, props.token)
        // Remove from queue on success
        uploadQueue.value = uploadQueue.value.filter((q) => q.id !== item.id)

        // FIX: Update modelValue by adding ONLY the new URL (not accumulated)
        emit('update:modelValue', [...props.modelValue, publicUrl])
      } catch (e: any) {
        console.error(e)

        // Check permission error
        const isPermissionError =
          e?.status === 404 ||
          e?.message?.includes('Not Found') ||
          e?.message?.includes('createBlob')

        if (isPermissionError) {
          console.warn('🔒 User lacks repository write permission. Falling back to Imgur.')
          try {
            const imgurUrl = await uploadToImgur(item.file)
            uploadQueue.value = uploadQueue.value.filter((q) => q.id !== item.id)
            emit('update:modelValue', [...props.modelValue, imgurUrl])
            continue // Success, move to next
          } catch (imgurError) {
            console.error('Imgur fallback failed:', imgurError)
          }
        }

        // Mark error in queue
        const qItem = uploadQueue.value.find((q) => q.id === item.id)
        if (qItem) {
          qItem.progress = false
          qItem.error = t('imageUploader.uploadFailed') || 'Upload failed'
        }
      }
    }
  } finally {
    isUploading.value = false
  }
}

const removeImage = (index: number) => {
  const newImages = [...props.modelValue]
  newImages.splice(index, 1)
  emit('update:modelValue', newImages)
}

const removeQueueItem = (id: string) => {
  uploadQueue.value = uploadQueue.value.filter((item) => item.id !== id)
}

const viewImage = (url: string) => {
  zoomedImage.value = url
}

const closeZoom = () => {
  zoomedImage.value = null
}
</script>

<template>
  <div class="image-uploader">
    <!-- Grid of Images -->
    <div v-if="modelValue.length > 0 || uploadQueue.length > 0" class="image-grid">
      <!-- Existing Images -->
      <div
        v-for="(url, index) in modelValue"
        :key="url"
        class="image-item"
        @dblclick="viewImage(url)"
      >
        <img :src="url" class="preview-img" :alt="`Image ${index + 1}`" />
        <button class="remove-btn" @click="removeImage(index)">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="zoom-hint">{{ t('imageUploader.doubleClickZoom') || '双击查看大图' }}</div>
      </div>

      <!-- Uploading Items -->
      <div v-for="item in uploadQueue" :key="item.id" class="image-item uploading">
        <img :src="item.url" class="preview-img" alt="Uploading" />
        <div v-if="item.progress" class="overlay">
          <div class="spinner"></div>
        </div>
        <div v-if="item.error" class="overlay error">
          <span>!</span>
          <button class="remove-btn" @click="removeQueueItem(item.id)">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Drop Zone -->
    <div
      v-if="limit === 1 || modelValue.length + uploadQueue.length < (limit || 9)"
      class="drop-zone"
      :class="{
        'is-dragging': isDragging,
        'is-compact': modelValue.length > 0,
        'is-disabled': isUploading,
      }"
      @dragenter.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @dragover.prevent
      @drop.prevent="handleDrop"
      @click="triggerSelect"
    >
      <input
        ref="fileInput"
        type="file"
        class="hidden-input"
        accept="image/*"
        multiple
        @change="handleFileSelect"
      />
      <div class="zone-content">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="upload-icon"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <span class="upload-text">{{ t('imageUploader.dropText') }}</span>
      </div>
    </div>

    <!-- URL Input (Alternative for users without write access) -->
    <div v-if="limit === 1 && modelValue.length === 0" class="url-input-section">
      <div class="url-input-label">或粘贴图片URL:</div>
      <div class="url-input-group">
        <input
          v-model="imageUrlInput"
          type="url"
          class="url-input"
          placeholder="https://example.com/image.jpg"
          @keyup.enter="addImageFromUrl"
        />
        <button
          type="button"
          class="url-add-btn"
          :disabled="!imageUrlInput.trim()"
          @click="addImageFromUrl"
        >
          添加
        </button>
      </div>
      <div class="url-hint">
        推荐使用: <a href="https://imgur.com" target="_blank">Imgur</a>,
        <a href="https://sm.ms" target="_blank">SM.MS</a>,
        <a href="https://postimages.org" target="_blank">PostImages</a>
      </div>
    </div>

    <!-- Zoom Modal -->
    <div v-if="zoomedImage" class="zoom-modal" @click="closeZoom">
      <div class="zoom-backdrop"></div>
      <div class="zoom-content">
        <img :src="zoomedImage" alt="Zoomed image" />
        <button class="zoom-close" @click="closeZoom">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-uploader {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-gray-200);
  cursor: pointer;
  transition: transform 0.2s;
}

.image-item:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.2s,
    background 0.2s;
  z-index: 2;
}

.remove-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.image-item:hover .remove-btn {
  opacity: 1;
}

.zoom-hint {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  text-align: center;
  padding: 0.5rem;
  font-size: var(--text-xs);
  opacity: 0;
  transition: opacity 0.2s;
}

.image-item:hover .zoom-hint {
  opacity: 1;
}

@media (max-width: 768px) {
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }

  .remove-btn {
    opacity: 1;
    background: rgba(0, 0, 0, 0.7);
    width: 32px;
    height: 32px;
  }

  .zoom-hint {
    opacity: 1;
    background: rgba(0, 0, 0, 0.5);
  }
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay.error {
  background: rgba(255, 0, 0, 0.1);
  color: red;
  font-weight: bold;
}

.drop-zone {
  border: 2px dashed var(--color-gray-300);
  border-radius: var(--radius-lg);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background-color: var(--color-gray-50);
}

.drop-zone.is-compact {
  padding: 1rem;
  border-width: 1px;
}

.drop-zone:hover,
.drop-zone.is-dragging {
  border-color: var(--color-gray-400);
  background-color: var(--color-gray-100);
}

.drop-zone.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  background-color: var(--color-gray-50);
  border-color: var(--color-gray-200);
}

.hidden-input {
  display: none;
}

.zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-gray-500);
}

.upload-text {
  font-size: var(--text-sm);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-primary);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* URL Input Section */
.url-input-section {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-surface-alt, #f9fafb);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-md);
}

.url-input-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.url-input-group {
  display: flex;
  gap: 0.5rem;
}

.url-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background: white;
}

.url-input:focus {
  outline: none;
  border-color: var(--color-primary, #000);
}

.url-add-btn {
  padding: 0.5rem 1rem;
  background: var(--color-primary, #000);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.url-add-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.url-add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.url-hint {
  margin-top: 0.5rem;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.url-hint a {
  color: var(--color-primary, #000);
  text-decoration: underline;
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
  max-width: 90vw;
  max-height: 90vh;
  z-index: 10000;
}

.zoom-content img {
  max-width: 100%;
  max-height: 90vh;
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
</style>
