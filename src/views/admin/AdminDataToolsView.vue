<template>
  <section class="data-tools">
    <header class="tools-header">
      <h2>{{ t('dataTools.title') }}</h2>
      <p>{{ t('dataTools.subtitle') }}</p>
    </header>

    <div class="tools-grid">
      <article class="tool-card">
        <h3>{{ t('dataTools.exports.title') }}</h3>
        <p>{{ t('dataTools.exports.desc') }}</p>
        <button type="button" class="tool-button" @click="handleClick('export')">
          {{ t('dataTools.exports.action') }}
        </button>
      </article>

      <article class="tool-card">
        <h3>{{ t('dataTools.backups.title') }}</h3>
        <p>{{ t('dataTools.backups.desc') }}</p>
        <button type="button" class="tool-button" @click="handleClick('backup')">
          {{ t('dataTools.backups.action') }}
        </button>
      </article>

      <article class="tool-card">
        <h3>{{ t('dataTools.quality.title') }}</h3>
        <p>{{ t('dataTools.quality.desc') }}</p>
        <button type="button" class="tool-button" @click="handleClick('data quality')">
          {{ t('dataTools.quality.action') }}
        </button>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

function handleClick(action: string) {
  console.info(`[admin] ${action} action is not connected yet.`)
}
</script>

<style scoped>
.data-tools {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.tools-header h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-gray-900);
}

.tools-header p {
  color: var(--color-gray-500);
  margin-top: 0.5rem;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.tool-card {
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tool-card h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-gray-900);
}

.tool-card p {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
  line-height: 1.6;
}

.tool-button {
  align-self: flex-start;
  padding: 0.65rem 1.1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-900);
  background-color: var(--color-black);
  color: var(--color-white);
  font-size: var(--text-sm);
  transition: background-color var(--transition-base);
}

.tool-button:hover,
.tool-button:focus-visible {
  background-color: var(--color-gray-900);
}
</style>
