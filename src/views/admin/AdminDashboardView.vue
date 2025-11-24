<template>
  <section class="dashboard">
    <header class="dashboard-header">
      <h2>{{ t('dashboard.title') }}</h2>
      <p>{{ t('dashboard.subtitle') }}</p>
    </header>

    <div class="stats-grid">
      <article v-for="stat in stats" :key="stat.label" class="stat-card">
        <span class="stat-label">{{ stat.label }}</span>
        <span class="stat-value">{{ stat.value }}</span>
        <span class="stat-meta">{{ stat.meta }}</span>
      </article>
    </div>

    <div class="panels-grid">
      <article class="panel">
        <h3>{{ t('dashboard.panels.recent') }}</h3>
        <p>{{ t('dashboard.panels.recentDesc') }}</p>
      </article>
      <article class="panel">
        <h3>{{ t('dashboard.panels.moderation') }}</h3>
        <p>{{ t('dashboard.panels.moderationDesc') }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const stats = computed(() => [
  {
    label: t('dashboard.stats.published'),
    value: '128',
    meta: t('dashboard.stats.meta.daily'),
  },
  {
    label: t('dashboard.stats.pending'),
    value: '6',
    meta: t('dashboard.stats.meta.moderation'),
  },
  {
    label: t('dashboard.stats.new'),
    value: '14',
    meta: t('dashboard.stats.meta.days'),
  },
  {
    label: t('dashboard.stats.flagged'),
    value: '3',
    meta: t('dashboard.stats.meta.followUp'),
  },
])
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.dashboard-header h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-gray-900);
}

.dashboard-header p {
  margin-top: 0.5rem;
  color: var(--color-gray-500);
}

.stats-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.stat-card {
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: var(--shadow-sm);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--color-gray-500);
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-gray-900);
}

.stat-meta {
  font-size: var(--text-xs);
  color: var(--color-gray-500);
}

.panels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.panel {
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.panel h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-gray-900);
}

.panel p {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
  line-height: 1.6;
}
</style>
