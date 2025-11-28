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
  document.addEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        @click="emit('close')"
      ></div>

      <!-- Modal Panel -->
      <div
        class="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden transition-all transform"
        :class="{
          'max-w-md': size === 'sm',
          'max-w-lg': size === 'md' || !size,
          'max-w-2xl': size === 'lg',
          'max-w-5xl': size === 'xl',
          'max-w-full h-full': size === 'full',
        }"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800"
        >
          <h3 v-if="title" class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ title }}
          </h3>
          <slot v-else name="header"></slot>

          <button
            class="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            @click="emit('close')"
          >
            <!-- Simple X Icon -->
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
        <div class="flex-1 overflow-y-auto p-6">
          <slot></slot>
        </div>

        <!-- Footer -->
        <div
          v-if="$slots.footer"
          class="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3"
        >
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>
