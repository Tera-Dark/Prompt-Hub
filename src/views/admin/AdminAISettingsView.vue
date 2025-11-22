<template>
  <div class="ai-settings">
    <header class="settings-header">
      <h2>{{ t('ai.title') }}</h2>
      <p>{{ t('ai.subtitle') }}</p>
    </header>

    <div class="settings-layout">
      <!-- Sidebar: Provider List -->
      <aside class="providers-sidebar">
        <div class="sidebar-title">{{ t('ai.providers') }}</div>
        <div class="provider-list">
          <div
            v-for="provider in providers"
            :key="provider.id"
            class="provider-item"
            :class="{ 'is-active': selectedProviderId === provider.id }"
            @click="selectProvider(provider.id)"
          >
            <div class="provider-info">
              <img :src="provider.icon" :alt="provider.name" class="provider-icon" />
              <span class="provider-name">{{ provider.name }}</span>
            </div>
            <label class="switch" @click.stop>
              <input
                type="checkbox"
                :checked="provider.enabled"
                @change="toggleProvider(provider.id, ($event.target as HTMLInputElement).checked)"
              />
              <span class="slider round"></span>
            </label>
          </div>
        </div>
      </aside>

      <!-- Main Content: Configuration Form -->
      <main v-if="selectedProvider" class="config-panel">
        <div class="panel-header">
          <div class="provider-badge">
            <img :src="selectedProvider.icon" :alt="selectedProvider.name" class="badge-icon" />
            <h3>{{ selectedProvider.name }}</h3>
          </div>
          <div class="status-badge" :class="{ 'is-enabled': selectedProvider.enabled }">
            {{ selectedProvider.enabled ? t('ai.enabled') : 'Disabled' }}
          </div>
        </div>

        <div class="config-form">
          <div class="form-group">
            <label>{{ t('ai.apiKey') }}</label>
            <div class="input-wrapper">
              <input
                v-model="selectedProvider.config.apiKey"
                type="password"
                placeholder="sk-..."
                @change="updateConfig"
              />
            </div>
          </div>

          <div class="form-group">
            <label>{{ t('ai.baseUrl') }}</label>
            <div class="input-wrapper">
              <input
                v-model="selectedProvider.config.baseUrl"
                type="text"
                placeholder="https://api.example.com/v1"
                @change="updateConfig"
              />
            </div>
          </div>

          <div class="models-section">
            <div class="section-header">
              <h4>{{ t('ai.models') }}</h4>
              <button v-if="!showAddModel" class="btn-sm" @click="showAddModel = true">
                + {{ t('ai.addModel') }}
              </button>
            </div>

            <!-- Add Model Form -->
            <div v-if="showAddModel" class="add-model-form">
              <input v-model="newModel.id" :placeholder="t('ai.modelId')" class="input-sm" />
              <input v-model="newModel.name" :placeholder="t('ai.modelName')" class="input-sm" />
              <div class="form-actions">
                <button class="btn-sm primary" @click="confirmAddModel">
                  {{ t('common.add') }}
                </button>
                <button class="btn-sm" @click="cancelAddModel">{{ t('common.cancel') }}</button>
              </div>
            </div>

            <!-- Model List -->
            <div class="model-list">
              <div
                v-for="model in selectedProvider.config.models"
                :key="model.id"
                class="model-item"
              >
                <div class="model-info">
                  <span class="model-name">{{ model.name }}</span>
                  <span class="model-id">{{ model.id }}</span>
                </div>
                <button
                  class="btn-icon delete"
                  :title="t('common.delete')"
                  @click="removeModel(selectedProvider!.id, model.id)"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAIConfig } from '@/composables/useAIConfig'

const { t } = useI18n()
const { providers, toggleProvider, addModel, removeModel } = useAIConfig()

const selectedProviderId = ref<string>(providers.value[0]?.id || '')
const showAddModel = ref(false)
const newModel = ref({ id: '', name: '' })

const selectedProvider = computed(() =>
  providers.value.find((p) => p.id === selectedProviderId.value),
)

function selectProvider(id: string) {
  selectedProviderId.value = id
  showAddModel.value = false
}

function updateConfig() {
  // Changes are reactive, but we might want to trigger explicit save or validation here if needed
  // The composable watches for changes and persists them
}

function confirmAddModel() {
  if (newModel.value.id && newModel.value.name && selectedProviderId.value) {
    addModel(selectedProviderId.value, { ...newModel.value })
    newModel.value = { id: '', name: '' }
    showAddModel.value = false
  }
}

function cancelAddModel() {
  newModel.value = { id: '', name: '' }
  showAddModel.value = false
}
</script>

<style scoped>
.ai-settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
}

.settings-header h2 {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-gray-900);
}

.settings-header p {
  color: var(--color-gray-500);
  font-size: var(--text-sm);
}

.settings-layout {
  display: flex;
  gap: 2rem;
  flex: 1;
  min-height: 0; /* For scrolling */
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* Sidebar */
.providers-sidebar {
  width: 280px;
  border-right: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
  display: flex;
  flex-direction: column;
}

.sidebar-title {
  padding: 1rem;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-gray-500);
  letter-spacing: 0.05em;
}

.provider-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 0.5rem 1rem;
}

.provider-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  margin-bottom: 0.25rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 0.2s;
}

.provider-item:hover {
  background-color: var(--color-gray-100);
}

.provider-item.is-active {
  background-color: var(--color-white);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-gray-200);
}

.provider-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.provider-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.provider-name {
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--color-gray-900);
}

/* Switch Toggle */
.switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-gray-300);
  transition: 0.4s;
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

.slider:before {
  position: absolute;
  content: '';
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.4s;
}

input:checked + .slider {
  background-color: var(--color-green-500, #10b981);
}

input:checked + .slider:before {
  transform: translateX(16px);
}

/* Main Content */
.config-panel {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-gray-200);
}

.provider-badge {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.badge-icon {
  width: 48px;
  height: 48px;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: 600;
  background: var(--color-gray-100);
  color: var(--color-gray-500);
}

.status-badge.is-enabled {
  background: var(--color-green-50, #ecfdf5);
  color: var(--color-green-700, #047857);
}

.config-form {
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-gray-700);
}

.input-wrapper input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  transition: border-color 0.2s;
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--color-black);
}

/* Models Section */
.models-section {
  margin-top: 1rem;
  border-top: 1px solid var(--color-gray-200);
  padding-top: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-header h4 {
  font-size: var(--text-base);
  font-weight: 600;
}

.btn-sm {
  padding: 0.35rem 0.75rem;
  font-size: var(--text-xs);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-gray-300);
  background: var(--color-white);
  cursor: pointer;
}

.btn-sm.primary {
  background: var(--color-black);
  color: var(--color-white);
  border-color: var(--color-black);
}

.add-model-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--color-gray-50);
  border-radius: var(--radius-md);
}

.input-sm {
  flex: 1;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
}

.form-actions {
  display: flex;
  gap: 0.5rem;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.model-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: var(--color-gray-50);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-100);
}

.model-info {
  display: flex;
  flex-direction: column;
}

.model-name {
  font-weight: 500;
  font-size: var(--text-sm);
}

.model-id {
  font-size: var(--text-xs);
  color: var(--color-gray-500);
  font-family: monospace;
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--color-gray-400);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 0.5rem;
}

.btn-icon:hover {
  color: var(--color-red-600, #dc2626);
}
</style>
