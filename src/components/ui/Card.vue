<template>
  <div class="ui-card">
    <div v-if="$slots.header || title" class="ui-card-header">
      <slot name="header">
        <h3 v-if="title" class="ui-card-title">{{ title }}</h3>
        <p v-if="subtitle" class="ui-card-subtitle">{{ subtitle }}</p>
      </slot>
    </div>
    <div class="ui-card-body">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="ui-card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
}

defineProps<Props>()
</script>

<style scoped>
.ui-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: box-shadow var(--transition-base);
}

.ui-card:hover {
  box-shadow: var(--shadow-md);
}

.ui-card-header {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid var(--color-border-light);
}

.ui-card-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.ui-card-subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0.25rem 0 0;
}

.ui-card-body {
  padding: 1.5rem;
}

.ui-card-footer {
  padding: 1rem 1.5rem;
  background-color: var(--color-surface-alt);
  border-top: 1px solid var(--color-border-light);
}
</style>
