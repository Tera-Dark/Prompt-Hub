<template>
  <span :class="['ui-badge', `ui-badge--${variant}`, { 'ui-badge--rounded': rounded }]">
    <slot></slot>
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  rounded?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  rounded: false,
})
</script>

<style scoped>
.ui-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.625rem;
  font-size: var(--text-xs);
  font-weight: 500;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  line-height: 1.5;
}

.ui-badge--rounded {
  border-radius: 9999px;
}

/* Variants */
.ui-badge--default {
  background-color: var(--color-surface-alt);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.ui-badge--primary {
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
  border: 1px solid var(--color-primary-light);
}

.ui-badge--success {
  background-color: var(--color-success-light);
  color: var(--color-success-dark);
  border: 1px solid var(--color-success-light);
}

.ui-badge--warning {
  background-color: var(--color-warning-light);
  color: var(--color-warning-dark);
  border: 1px solid var(--color-warning-light);
}

.ui-badge--danger {
  background-color: var(--color-danger-light);
  color: var(--color-danger-dark);
  border: 1px solid var(--color-danger-light);
}

.ui-badge--info {
  background-color: var(--color-info-light);
  color: var(--color-info-dark);
  border: 1px solid var(--color-info-light);
}
</style>
