<template>
  <section class="recommendation-section">
    <div class="section-header">
      <div class="title-group">
        <span class="icon">🔥</span>
        <h2>{{ t('recommendations.title') }}</h2>
      </div>
      <p class="subtitle">{{ t('recommendations.subtitle') }}</p>
    </div>

    <div v-if="loading" class="recommendation-grid">
      <PromptCardSkeleton v-for="i in 3" :key="i" />
    </div>

    <div v-else class="recommendation-grid">
      <PromptCard
        v-for="prompt in prompts"
        :key="prompt.id"
        :prompt="prompt"
        @click="$emit('select', prompt)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Prompt } from '@/types/prompt'
import PromptCard from '@/components/prompts/PromptCard.vue'
import PromptCardSkeleton from '@/components/prompts/PromptCardSkeleton.vue'

defineProps<{
  prompts: Prompt[]
  loading?: boolean
}>()

defineEmits<{
  (e: 'select', prompt: Prompt): void
}>()

const { t } = useI18n()
</script>

<style scoped>
.recommendation-section {
  margin-bottom: 3rem;
}

.section-header {
  margin-bottom: 1.5rem;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.icon {
  font-size: 1.5rem;
}

.section-header h2 {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.recommendation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}
</style>
