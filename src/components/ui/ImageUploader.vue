<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { uploadImage } from '../../services/image'

const props = defineProps<{
  modelValue: string[]
  limit?: number
  token: string
}>()

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadQueue = ref<
  { id: string; url?: string; file?: File; progress: boolean; error?: string }[]
>([])

// Initialize queue from modelValue
// We only track new uploads in the queue for progress, but we display everything mixed?
// Actually simpler: `modelValue` is the source of truth for *finished* uploads.
// We need a local state to show *uploading* items.

const triggerSelect = () => {
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
  isDragging.value = false
  if (event.dataTransfer?.files) {
    await processFiles(Array.from(event.dataTransfer.files))
  }
}

const processFiles = async (files: File[]) => {
  const remainingSlots = (props.limit || 9) - props.modelValue.length - uploadingCount.value
  if (remainingSlots <= 0) {
    alert(t('imageUploader.limitReached'))
    return
  }

  const filesToUpload = files.slice(0, remainingSlots)

  for (const file of filesToUpload) {
    if (!file.type.startsWith('image/')) continue
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      alert(t('imageUploader.fileTooLarge', { name: file.name }))
      continue
    }

    await uploadSingleFile(file)
  }
}

const uploadingCount = computed(() => uploadQueue.value.filter((item) => item.progress).length)

const uploadSingleFile = async (file: File) => {
  const id = Math.random().toString(36).substring(7)
  // Create local preview
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = (e) => {
    const previewUrl = e.target?.result as string
    uploadQueue.value.push({ id, url: previewUrl, file, progress: true })
  }

  try {
    const publicUrl = await uploadImage(file, props.token)
    // Update modelValue
    emit('update:modelValue', [...props.modelValue, publicUrl])
    // Remove from queue
    uploadQueue.value = uploadQueue.value.filter((item) => item.id !== id)
  } catch (e) {
    console.error(e)
    // Mark error in queue
    const item = uploadQueue.value.find((i) => i.id === id)
    if (item) {
      item.progress = false
      item.error = 'Upload failed'
    }
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
</script>

<template>
  <div class="image-uploader">
    <!-- Grid of Images -->
    <div v-if="modelValue.length > 0 || uploadQueue.length > 0" class="image-grid">
      <!-- Existing Images -->
      <div v-for="(url, index) in modelValue" :key="url" class="image-item">
        <img :src="url" class="preview-img" />
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
      </div>

      <!-- Uploading Items -->
      <div v-for="item in uploadQueue" :key="item.id" class="image-item uploading">
        <img :src="item.url" class="preview-img" />
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
      v-if="modelValue.length + uploadQueue.length < (limit || 9)"
      class="drop-zone"
      :class="{ 'is-dragging': isDragging, 'is-compact': modelValue.length > 0 }"
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
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-gray-200);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-item:hover .remove-btn {
  opacity: 1;
}

@media (max-width: 768px) {
  .remove-btn {
    opacity: 1;
    background: rgba(0, 0, 0, 0.7);
    width: 28px;
    height: 28px;
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
</style>
