<template>
  <div class="prompt-card-skeleton">
    <div class="card-header">
      <Skeleton width="60px" height="20px" />
    </div>
    <div class="card-content">
      <Skeleton width="80%" height="24px" style="margin-bottom: 0.5rem" />
      <Skeleton width="100%" height="16px" style="margin-bottom: 0.25rem" />
      <Skeleton width="90%" height="16px" />
    </div>
    <div class="card-footer">
      <div class="actions">
        <Skeleton width="32px" height="32px" />
        <Skeleton width="32px" height="32px" />
      </div>
      <Skeleton width="80px" height="16px" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Skeleton from '@/components/ui/Skeleton.vue'
</script>

<style scoped>
.prompt-card-skeleton {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 200px;
}

.card-header {
  margin-bottom: 1rem;
}

.card-content {
  flex: 1;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border-light);
}

.actions {
  display: flex;
  gap: 0.5rem;
}
</style>
