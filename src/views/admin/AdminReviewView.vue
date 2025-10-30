<template>
  <section class="review">
    <header class="review-header">
      <h2>Issues review</h2>
      <p>Inspect flagged prompts and moderation reports. Workflow coming soon.</p>
    </header>

    <div class="review-queue">
      <article v-for="item in queue" :key="item.id" class="review-card">
        <div class="card-header">
          <h3>{{ item.title }}</h3>
          <span class="badge">{{ item.priority }}</span>
        </div>
        <p class="card-summary">{{ item.summary }}</p>
        <div class="card-footer">
          <span>Reported by {{ item.reporter }}</span>
          <span>{{ item.age }}</span>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
const queue = [
  {
    id: 'mod-1',
    title: 'Bias review: Hiring assistant',
    summary: 'Double-check language for inclusive hiring recommendations.',
    reporter: 'Community check',
    age: '2 hours ago',
    priority: 'High',
  },
  {
    id: 'mod-2',
    title: 'Duplicate prompt',
    summary: 'Possible overlap with "Feature announcement copy" prompt.',
    reporter: 'Internal',
    age: '1 day ago',
    priority: 'Medium',
  },
  {
    id: 'mod-3',
    title: 'Outdated reference',
    summary: 'Mentions deprecated API version in prompt body.',
    reporter: 'Community report',
    age: '3 days ago',
    priority: 'Low',
  },
]
</script>

<style scoped>
.review {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.review-header h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-gray-900);
}

.review-header p {
  color: var(--color-gray-500);
  margin-top: 0.5rem;
}

.review-queue {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}

.review-card {
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.card-header h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-gray-900);
}

.badge {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.25rem 0.55rem;
  border-radius: 9999px;
  background-color: var(--color-gray-900);
  color: var(--color-white);
}

.card-summary {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
  line-height: 1.6;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--color-gray-500);
}

@media (max-width: 640px) {
  .card-footer {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>
