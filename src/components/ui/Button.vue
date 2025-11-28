<template>
  <button
    :class="[
      'ui-btn',
      `ui-btn--${variant}`,
      `ui-btn--${size}`,
      { 'ui-btn--loading': loading, 'ui-btn--block': block },
    ]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span v-if="loading" class="ui-btn-spinner"></span>
    <span v-else class="ui-btn-content">
      <slot name="icon-left"></slot>
      <slot></slot>
      <slot name="icon-right"></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  block?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  block: false,
})
</script>

<style scoped>
.ui-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
  font-family: inherit;
  line-height: 1;
  text-decoration: none;
}

.ui-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ui-btn--block {
  width: 100%;
  display: flex;
}

/* Sizes */
.ui-btn--sm {
  padding: 0.375rem 0.75rem;
  font-size: var(--text-xs);
  gap: 0.375rem;
}

.ui-btn--md {
  padding: 0.625rem 1.25rem;
  font-size: var(--text-sm);
  gap: 0.5rem;
}

.ui-btn--lg {
  padding: 0.875rem 1.75rem;
  font-size: var(--text-base);
  gap: 0.75rem;
}

/* Variants - Minimalist */
.ui-btn--primary {
  background-color: var(--color-black);
  color: var(--color-white);
  border-color: var(--color-black);
}

.ui-btn--primary:not(:disabled):hover {
  background-color: var(--color-gray-800);
  border-color: var(--color-gray-800);
}

.ui-btn--secondary {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
  border-color: transparent;
}

.ui-btn--secondary:not(:disabled):hover {
  background-color: var(--color-gray-200);
}

.ui-btn--outline {
  background-color: transparent;
  color: var(--color-text-primary);
  border-color: var(--color-border);
}

.ui-btn--outline:not(:disabled):hover {
  border-color: var(--color-text-primary);
  background-color: var(--color-surface-hover);
}

.ui-btn--ghost {
  background-color: transparent;
  color: var(--color-text-secondary);
}

.ui-btn--ghost:not(:disabled):hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.ui-btn--danger {
  background-color: transparent;
  color: var(--color-text-primary);
  border-color: var(--color-text-primary);
}

.ui-btn--danger:not(:disabled):hover {
  background-color: var(--color-black);
  color: var(--color-white);
  border-color: var(--color-black);
}

.ui-btn--success {
  background-color: transparent;
  color: var(--color-text-primary);
  border-color: var(--color-text-primary);
}

.ui-btn--success:not(:disabled):hover {
  background-color: var(--color-black);
  color: var(--color-white);
  border-color: var(--color-black);
}

/* Loading */
.ui-btn-spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

.ui-btn-content {
  display: flex;
  align-items: center;
  gap: inherit;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
