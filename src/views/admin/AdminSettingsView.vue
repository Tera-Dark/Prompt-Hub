<template>
  <section class="settings">
    <header class="settings-header">
      <h2>Settings</h2>
      <p>Personal preferences</p>
    </header>

    <form class="settings-form" @submit.prevent="save">
      <div class="form-grid">
        <label class="form-field">
          <span>Theme</span>
          <select v-model="theme">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label class="form-field">
          <span>Prompt list page size</span>
          <select v-model.number="pageSize">
            <option :value="12">12</option>
            <option :value="24">24</option>
            <option :value="48">48</option>
          </select>
        </label>
      </div>
      <div class="form-actions">
        <button type="submit" class="primary">Save</button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const theme = ref<'light'|'dark'>('light')
const pageSize = ref<number>(24)

const THEME_KEY = 'prompt-hub::pref::theme'
const PAGE_SIZE_KEY = 'prompt-hub::pref::pageSize'

onMounted(() => {
  try {
    const t = localStorage.getItem(THEME_KEY)
    if (t === 'dark' || t === 'light') theme.value = t as any
    const p = Number(localStorage.getItem(PAGE_SIZE_KEY))
    if (!Number.isNaN(p) && p > 0) pageSize.value = p
  } catch {}
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
    alert('Settings saved')
  } catch {
    alert('Failed to save settings')
  }
}
</script>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-header h2 {
  font-size: var(--text-xl);
}

.settings-form {
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

select {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-200);
  background-color: var(--color-white);
  color: var(--color-gray-900);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.primary {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-900);
  background-color: var(--color-black);
  color: var(--color-white);
}
</style>
