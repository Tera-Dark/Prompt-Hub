<template>
  <section class="prompts">
    <header class="prompts-header">
      <div>
        <h2>Prompts</h2>
        <p>Manage published prompts and drafts. Data wiring is pending.</p>
      </div>
      <RouterLink to="/admin/prompts/new" class="new-button">New prompt</RouterLink>
    </header>

    <div class="prompts-card">
      <header class="prompts-card__header">
        <span>Title</span>
        <span>Status</span>
        <span>Updated</span>
      </header>
      <ul class="prompts-list">
        <li v-for="prompt in placeholders" :key="prompt.title" class="prompts-row">
          <div class="prompt-info">
            <h3>{{ prompt.title }}</h3>
            <p>{{ prompt.description }}</p>
          </div>
          <span class="prompt-status">{{ prompt.status }}</span>
          <RouterLink :to="prompt.editLink" class="prompt-edit">{{ prompt.updated }}</RouterLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

const placeholders = [
  {
    title: 'Customer onboarding emails',
    description: 'Guidance for crafting welcome messages across segments.',
    status: 'Published',
    updated: 'Edit',
    editLink: '/admin/prompts/1/edit',
  },
  {
    title: 'Bug triage assistant',
    description: 'Classify issue reports by severity and domain.',
    status: 'Draft',
    updated: 'Edit',
    editLink: '/admin/prompts/2/edit',
  },
  {
    title: 'Support reply enhancer',
    description: 'Suggest empathetic phrasing based on ticket tone.',
    status: 'Published',
    updated: 'Edit',
    editLink: '/admin/prompts/3/edit',
  },
]
</script>

<style scoped>
.prompts {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.prompts-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.prompts-header h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-gray-900);
}

.prompts-header p {
  color: var(--color-gray-500);
  margin-top: 0.5rem;
}

.new-button {
  padding: 0.65rem 1.1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-900);
  background-color: var(--color-black);
  color: var(--color-white);
  font-size: var(--text-sm);
  transition: background-color var(--transition-base);
}

.new-button:hover,
.new-button:focus-visible {
  background-color: var(--color-gray-900);
}

.prompts-card {
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.prompts-card__header {
  display: grid;
  grid-template-columns: 2fr 120px 120px;
  padding: 1rem 1.5rem;
  font-size: var(--text-sm);
  font-weight: 600;
  background-color: var(--color-gray-50);
  color: var(--color-gray-600);
}

.prompts-list {
  display: flex;
  flex-direction: column;
}

.prompts-row {
  display: grid;
  grid-template-columns: 2fr 120px 120px;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--color-gray-100);
}

.prompts-row:first-of-type {
  border-top: none;
}

.prompt-info h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-gray-900);
}

.prompt-info p {
  font-size: var(--text-sm);
  color: var(--color-gray-500);
  margin-top: 0.25rem;
}

.prompt-status {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
}

.prompt-edit {
  font-size: var(--text-sm);
  color: var(--color-gray-900);
  justify-self: flex-start;
  border-bottom: 1px solid transparent;
  padding-bottom: 0.1rem;
}

.prompt-edit:hover,
.prompt-edit:focus-visible {
  border-color: var(--color-gray-800);
}

@media (max-width: 960px) {
  .prompts-card__header,
  .prompts-row {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .prompts-card__header {
    display: none;
  }

  .prompts-row {
    gap: 0.75rem;
  }

  .prompt-status,
  .prompt-edit {
    justify-self: flex-start;
  }
}
</style>
