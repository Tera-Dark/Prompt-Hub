<template>
  <div class="ui-toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['ui-toast', `ui-toast--${toast.type}`]"
        role="alert"
      >
        <div class="ui-toast-icon">
          <span v-if="toast.type === 'success'">✓</span>
          <span v-else-if="toast.type === 'error'">✕</span>
          <span v-else-if="toast.type === 'warning'">!</span>
          <span v-else>i</span>
        </div>
        <div class="ui-toast-content">{{ toast.message }}</div>
        <button class="ui-toast-close" @click="remove(toast.id)">×</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()
</script>

<style scoped>
.ui-toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 100;
  pointer-events: none;
}

.ui-toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  min-width: 300px;
  max-width: 400px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

.ui-toast-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: bold;
}

.ui-toast-content {
  flex: 1;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  line-height: 1.4;
}

.ui-toast-close {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  padding: 0;
}

.ui-toast-close:hover {
  color: var(--color-text-primary);
}

/* Variants */
.ui-toast--success .ui-toast-icon {
  background-color: var(--color-success);
  color: var(--color-white);
}

.ui-toast--error .ui-toast-icon {
  background-color: var(--color-danger);
  color: var(--color-white);
}

.ui-toast--warning .ui-toast-icon {
  background-color: var(--color-warning);
  color: var(--color-white);
}

.ui-toast--info .ui-toast-icon {
  background-color: var(--color-info);
  color: var(--color-white);
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
