<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

defineProps<{
  isOpen: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}>()

const emit = defineEmits(['close'])

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay">
      <!-- Backdrop -->
      <div class="modal-backdrop" @click="emit('close')"></div>

      <!-- Modal Panel -->
      <div
        class="modal-panel"
        :class="{
          'modal-sm': size === 'sm',
          'modal-md': size === 'md' || !size,
          'modal-lg': size === 'lg',
          'modal-xl': size === 'xl',
          'modal-full': size === 'full',
        }"
      >
        <!-- Header -->
        <div class="modal-header">
          <h3 v-if="title" class="modal-title">
            {{ title }}
          </h3>
          <slot v-else name="header"></slot>

          <button class="close-btn" @click="emit('close')">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="modal-content">
          <slot></slot>
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  transition: opacity 0.3s ease;
}

.modal-panel {
  position: relative;
  background-color: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.3s ease;
  z-index: 51;
}

/* Dark mode override if needed, assuming CSS variables handle it */
@media (prefers-color-scheme: dark) {
  .modal-panel {
    background-color: var(--color-gray-900);
  }
}

/* Sizes */
.modal-sm {
  max-width: 28rem;
}
.modal-md {
  max-width: 32rem;
}
.modal-lg {
  max-width: 42rem;
}
.modal-xl {
  max-width: 64rem;
}
.modal-full {
  max-width: 100%;
  height: 100%;
  border-radius: 0;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-gray-100);
}

.modal-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-gray-900);
}

.close-btn {
  padding: 0.5rem;
  color: var(--color-gray-400);
  border-radius: 9999px;
  transition: all 0.2s;
  cursor: pointer;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--color-gray-500);
  background-color: var(--color-gray-100);
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-gray-100);
  background-color: var(--color-gray-50);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
