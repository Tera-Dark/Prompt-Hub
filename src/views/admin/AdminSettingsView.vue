<template>
  <div class="settings-container">
    <Card :title="t('settings.title')" :subtitle="t('settings.subtitle')">
      <form @submit.prevent="save">
        <div class="form-grid">
          <div class="form-group">
            <label class="ui-label">{{ t('settings.theme') }}</label>
            <select v-model="theme" class="ui-select">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div class="form-group">
            <label class="ui-label">{{ t('settings.pageSize') }}</label>
            <select v-model.number="pageSize" class="ui-select">
              <option :value="12">12</option>
              <option :value="24">24</option>
              <option :value="48">48</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <Button type="submit" variant="primary">{{ t('common.save') }}</Button>
        </div>
      </form>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const { success, error } = useToast()

const theme = ref<'light' | 'dark'>('light')
const pageSize = ref<number>(24)

const THEME_KEY = 'prompt-hub::pref::theme'
const PAGE_SIZE_KEY = 'prompt-hub::pref::pageSize'

onMounted(() => {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY)
    if (savedTheme === 'dark' || savedTheme === 'light') theme.value = savedTheme
    const savedPageSize = Number(localStorage.getItem(PAGE_SIZE_KEY))
    if (!Number.isNaN(savedPageSize) && savedPageSize > 0) pageSize.value = savedPageSize
  } catch {
    // Silently fail
  }
})

function applyTheme() {
  const el = document.documentElement
  if (theme.value === 'dark') {
    el.setAttribute('data-theme', 'dark')
    el.classList.add('dark')
  } else {
    el.setAttribute('data-theme', 'light')
    el.classList.remove('dark')
  }
}

function save() {
  try {
    localStorage.setItem(THEME_KEY, theme.value)
    localStorage.setItem(PAGE_SIZE_KEY, String(pageSize.value))
    applyTheme()
    success('Settings saved successfully')
  } catch (err) {
    error('Failed to save settings')
  }
}
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ui-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-primary);
}

.ui-select {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.ui-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
