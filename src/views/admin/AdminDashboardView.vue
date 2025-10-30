<template>
  <section class="dashboard">
    <header class="dashboard-header">
      <h2>Dashboard</h2>
      <p>Monitor high-level activity across prompts and moderation.</p>
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
        <h3>Recent prompt submissions</h3>
        <p>Submission activity will appear here after the data pipeline is connected.</p>
      </article>
      <article class="panel">
        <h3>Moderation summary</h3>
        <p>Track outstanding issues and approvals from the review workspace.</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
const stats = [
  { label: 'Published prompts', value: '128', meta: 'Updated daily' },
  { label: 'Pending review', value: '6', meta: 'Requires moderation' },
  { label: 'New submissions', value: '14', meta: 'Last 7 days' },
  { label: 'Flagged issues', value: '3', meta: 'Needs follow-up' },
]
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
