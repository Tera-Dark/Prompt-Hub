<template>
  <div class="ai-settings-container">
    <div class="settings-layout">
      <!-- Sidebar -->
      <Card class="providers-sidebar">
        <div class="sidebar-header">
          <h3>{{ t('ai.providers') }}</h3>
        </div>
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
      </Card>

      <!-- Main Content -->
      <Card v-if="selectedProvider" class="config-panel">
        <template #header>
          <div class="panel-header">
            <div class="provider-badge">
              <img :src="selectedProvider.icon" :alt="selectedProvider.name" class="badge-icon" />
              <div>
                <h2 class="provider-title">{{ selectedProvider.name }}</h2>
                <Badge :variant="selectedProvider.enabled ? 'success' : 'default'">
                  {{ selectedProvider.enabled ? t('ai.enabled') : 'Disabled' }}
                </Badge>
              </div>
            </div>
          </div>
        </template>

        <div class="config-form">
          <Input
            v-model="selectedProvider.config.apiKey"
            type="password"
            :label="t('ai.apiKey')"
            placeholder="sk-..."
          />

          <Input
            v-model="selectedProvider.config.baseUrl"
            :label="t('ai.baseUrl')"
            placeholder="https://api.example.com/v1"
          />

          <div class="models-section">
            <div class="section-header">
              <h4>{{ t('ai.models') }}</h4>
              <Button
                v-if="!showAddModel"
                size="sm"
                variant="secondary"
                @click="showAddModel = true"
              >
                + {{ t('ai.addModel') }}
              </Button>
            </div>

            <!-- Add Model Form -->
            <div v-if="showAddModel" class="add-model-form">
              <Input v-model="newModel.id" :placeholder="t('ai.modelId')" class="flex-1" />
              <Input v-model="newModel.name" :placeholder="t('ai.modelName')" class="flex-1" />
              <div class="form-actions">
                <Button size="sm" variant="primary" @click="confirmAddModel">
                  {{ t('common.add') }}
                </Button>
                <Button size="sm" variant="ghost" @click="cancelAddModel">
                  {{ t('common.cancel') }}
                </Button>
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
                <Button
                  variant="ghost"
                  size="sm"
                  class="delete-btn"
                  @click="removeModel(selectedProvider!.id, model.id)"
                >
                  ✕
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAIConfig } from '@/composables/useAIConfig'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'

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
.ai-settings-container {
  height: 100%;
}

.settings-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
  height: calc(100vh - 140px); /* Adjust based on header height */
}

.providers-sidebar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1rem;
}

.sidebar-header h3 {
  font-size: var(--text-sm);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  letter-spacing: 0.05em;
  margin: 0;
}

.provider-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.provider-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-base);
}

.provider-item:hover {
  background-color: var(--color-surface-hover);
}

.provider-item.is-active {
  background-color: var(--color-primary-subtle);
  border: 1px solid var(--color-primary-light);
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
  color: var(--color-text-primary);
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
  background-color: var(--color-text-tertiary);
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
  background-color: var(--color-success);
}

input:checked + .slider:before {
  transform: translateX(16px);
}

/* Main Content */
.config-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.provider-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.25rem 0;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.models-section {
  margin-top: 1rem;
  border-top: 1px solid var(--color-border);
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
  margin: 0;
}

.add-model-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  align-items: center;
}

.flex-1 {
  flex: 1;
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
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.model-info {
  display: flex;
  flex-direction: column;
}

.model-name {
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
}

.model-id {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  font-family: monospace;
}

.delete-btn {
  color: var(--color-text-tertiary);
}

.delete-btn:hover {
  color: var(--color-danger);
  background-color: var(--color-danger-light);
}

@media (max-width: 768px) {
  .settings-layout {
    grid-template-columns: 1fr;
    height: auto;
  }

  .providers-sidebar {
    max-height: 300px;
  }
}
</style>
