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
  padding: 0.125rem 0.5rem;
  font-size: var(--text-xs);
  font-weight: 500;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  line-height: 1.5;
  border: 1px solid transparent;
}

.ui-badge--rounded {
  border-radius: 9999px;
}

/* Variants - Minimalist */
.ui-badge--default {
  background-color: var(--color-surface-alt);
  color: var(--color-text-secondary);
  border-color: var(--color-border);
}

.ui-badge--primary {
  background-color: var(--color-black);
  color: var(--color-white);
}

.ui-badge--success {
  background-color: transparent;
  color: var(--color-text-primary);
  border-color: var(--color-text-primary);
}

.ui-badge--warning {
  background-color: transparent;
  color: var(--color-text-primary);
  border-color: var(--color-text-primary);
  border-style: dashed;
}

.ui-badge--danger {
  background-color: transparent;
  color: var(--color-text-primary);
  border-color: var(--color-text-primary);
  text-decoration: line-through;
}

.ui-badge--info {
  background-color: var(--color-surface-alt);
  color: var(--color-text-primary);
}
</style>
