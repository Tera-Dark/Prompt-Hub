<template>
  <div class="toast" :class="type" role="alert">
    <div class="toast-icon">
      <svg v-if="type === 'success'" viewBox="0 0 24 24" width="20" height="20">
        <path
          fill="currentColor"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
        />
      </svg>
      <svg v-else-if="type === 'error'" viewBox="0 0 24 24" width="20" height="20">
        <path
          fill="currentColor"
          d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"
        />
      </svg>
      <svg v-else-if="type === 'warning'" viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="20" height="20">
        <path
          fill="currentColor"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
        />
      </svg>
    </div>
    <div class="toast-content">{{ message }}</div>
    <button class="toast-close" @click="$emit('close')">×</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>

<style scoped>
.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  background: var(--color-white);
  box-shadow: var(--shadow-lg);
  min-width: 300px;
  max-width: 400px;
  animation: slideIn 0.3s ease-out;
  border-left: 4px solid transparent;
}

.toast.success {
  border-left-color: var(--color-green-500);
}
.toast.error {
  border-left-color: var(--color-red-500);
}
.toast.warning {
  border-left-color: var(--color-yellow-500);
}
.toast.info {
  border-left-color: var(--color-blue-500);
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.success .toast-icon {
  color: var(--color-green-500);
}
.error .toast-icon {
  color: var(--color-red-500);
}
.warning .toast-icon {
  color: var(--color-yellow-500);
}
.info .toast-icon {
  color: var(--color-blue-500);
}

.toast-content {
  flex: 1;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  color: var(--color-text-tertiary);
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}

.toast-close:hover {
  color: var(--color-text-primary);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
