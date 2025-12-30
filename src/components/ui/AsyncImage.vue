<template>
  <div class="async-image-container" :class="{ loaded: isLoaded, 'load-error': hasError }">
    <!-- Skeleton Loader -->
    <div v-if="!isLoaded && !hasError" class="image-skeleton">
      <div class="shimmer"></div>
    </div>

    <!-- Actual Image -->
    <img
      v-show="isLoaded"
      ref="imgRef"
      :src="src"
      :alt="alt"
      :class="['async-image', imgClass]"
      loading="lazy"
      @load="handleLoad"
      @error="handleError"
    />

    <!-- Error Fallback -->
    <div v-if="hasError" class="image-error">
      <Icon name="image-off" :size="24" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps<{
  src?: string
  alt?: string
  imgClass?: string
}>()

const isLoaded = ref(false)
const hasError = ref(false)

const handleLoad = () => {
  isLoaded.value = true
  hasError.value = false
}

const handleError = () => {
  isLoaded.value = false
  hasError.value = true
}

// Reset state when src changes
watch(
  () => props.src,
  () => {
    isLoaded.value = false
    hasError.value = false
  },
)
</script>

<style scoped>
.async-image-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--color-gray-100);
}

.async-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
  opacity: 0;
}

.async-image-container.loaded .async-image {
  opacity: 1;
}

.image-skeleton {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--color-gray-200);
  z-index: 1;
}

.shimmer {
  width: 100%;
  height: 100%;
  transform: skewX(-20deg);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 1.5s infinite;
}

.image-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  background-color: var(--color-gray-100);
  z-index: 2;
}

@keyframes shimmer {
  0% {
    transform: translateX(-150%) skewX(-20deg);
  }
  100% {
    transform: translateX(150%) skewX(-20deg);
  }
}
</style>
