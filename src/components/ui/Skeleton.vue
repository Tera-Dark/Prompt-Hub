<template>
  <div class="skeleton" :style="{ width, height }"></div>
</template>

<script setup lang="ts">
defineProps({
  width: {
    type: String,
    default: '100%',
  },
  height: {
    type: String,
    default: '1rem',
  },
})
</script>

<style scoped>
.skeleton {
  background-color: var(--color-gray-200);
  border-radius: var(--radius-md);
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
