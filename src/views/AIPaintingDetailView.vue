<template>
  <div v-if="prompt" class="detail-container">
    <div class="container content-area">
      <!-- Header -->
      <header class="detail-header">
        <h1 class="title">{{ prompt.title }}</h1>
        <div class="meta-row">
          <span class="author">作者: {{ prompt.author?.username || 'Unknown' }}</span>
        </div>
        <div class="meta-row">
          <span class="label">底模类型:</span>
          <span class="value">{{ prompt.aiPaintingConfig?.baseModel || 'N/A' }}</span>
        </div>
        <div class="meta-row">
          <span class="label">简介:</span>
          <span class="value link">{{ prompt.description }}</span>
        </div>
        <div class="meta-row">
          <span class="label">是否为原图:</span>
          <span class="value">是</span>
        </div>
      </header>

      <!-- Positive Prompt -->
      <section class="prompt-section">
        <div class="section-header">
          <h3>正面提示词:</h3>
          <div class="actions">
            <Button size="sm" variant="secondary" @click="copyText(prompt.prompt)">
              <Icon name="copy" :size="14" />
              复制
            </Button>
            <Button size="sm" variant="secondary" class="icon-only">
              <Icon name="chevron-down" :size="14" />
            </Button>
          </div>
        </div>
        <div class="prompt-box">
          {{ prompt.prompt }}
        </div>
      </section>

      <!-- Negative Prompt -->
      <section class="prompt-section">
        <div class="section-header">
          <h3>负面提示词:</h3>
          <div class="actions">
            <Button
              size="sm"
              variant="secondary"
              @click="copyText(prompt.aiPaintingConfig?.negativePrompt || '')"
            >
              <Icon name="copy" :size="14" />
              复制
            </Button>
            <Button size="sm" variant="secondary" class="icon-only">
              <Icon name="chevron-down" :size="14" />
            </Button>
          </div>
        </div>
        <div class="prompt-box">
          {{ prompt.aiPaintingConfig?.negativePrompt || 'None' }}
        </div>
      </section>

      <!-- Parameters -->
      <section class="params-section">
        <h3>作品详情:</h3>
        <div class="tags-row">
          <span v-if="prompt.aiPaintingConfig?.resolution" class="param-tag">
            分辨率: {{ prompt.aiPaintingConfig.resolution }}
          </span>
          <span class="param-tag">
            生图工具: {{ prompt.aiPaintingConfig?.baseModel?.split(' ')[0] || 'Unknown' }}
          </span>
          <span v-if="prompt.aiPaintingConfig?.modelHash" class="param-tag">
            底模型号: {{ prompt.aiPaintingConfig.modelHash }}
          </span>
          <span v-if="prompt.aiPaintingConfig?.steps" class="param-tag">
            步数: {{ prompt.aiPaintingConfig.steps }}
          </span>
          <span v-if="prompt.aiPaintingConfig?.cfg" class="param-tag">
            CFG: {{ prompt.aiPaintingConfig.cfg }}
          </span>
          <span v-if="prompt.aiPaintingConfig?.sampler" class="param-tag">
            采样器: {{ prompt.aiPaintingConfig.sampler }}
          </span>
          <span v-if="prompt.aiPaintingConfig?.seed" class="param-tag">
            种子: {{ prompt.aiPaintingConfig.seed }}
          </span>
          <span v-if="prompt.aiPaintingConfig?.scheduler" class="param-tag">
            调度器: {{ prompt.aiPaintingConfig.scheduler }}
          </span>
        </div>
      </section>

      <div class="image-id-row">
        <span class="label">图片ID:</span>
        <span class="value">{{ prompt.id }}</span>
      </div>

      <div class="action-footer">
        <Button variant="primary" class="download-btn" @click="downloadImage"> 下载原图 </Button>
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="loading-state">Loading...</div>
  <div v-else class="error-state">Prompt not found</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePromptStore } from '@/stores/prompts'
import type { Prompt } from '@/types/prompt'
import Button from '@/components/ui/Button.vue'
import Icon from '@/components/ui/Icon.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const promptStore = usePromptStore()
const toast = useToast()

const prompt = ref<Prompt | undefined>(undefined)
const loading = ref(true)

onMounted(async () => {
  const id = route.params.id as string
  if (!promptStore.prompts.value.length) {
    await promptStore.fetchPrompts()
  }
  prompt.value = promptStore.prompts.value.find((p) => p.id === id)
  loading.value = false
})

function copyText(text: string) {
  if (!text) return
  navigator.clipboard.writeText(text)
  toast.success('Copied to clipboard')
}

function downloadImage() {
  if (prompt.value?.imageUrl) {
    window.open(prompt.value.imageUrl, '_blank')
  } else {
    toast.error('No image available')
  }
}
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
  background-color: #2b1d42; /* Deep purple background based on screenshot */
  color: #e0d0f5;
  padding: 2rem 0;
  font-family: sans-serif;
}

.content-area {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 1rem;
}

.detail-header {
  margin-bottom: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 0.5rem;
}

.meta-row {
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.meta-row .label {
  color: #bca6d9;
  margin-right: 0.5rem;
}

.meta-row .value {
  color: #e0d0f5;
}

.meta-row .value.link {
  color: #e0d0f5;
  text-decoration: underline;
}

.prompt-section {
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.section-header h3 {
  color: #bca6d9;
  font-size: 1rem;
  margin: 0;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.prompt-box {
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 8px;
  font-family: monospace;
  line-height: 1.6;
  color: #e0d0f5;
  white-space: pre-wrap;
  word-break: break-all;
}

.params-section {
  margin-bottom: 2rem;
}

.params-section h3 {
  color: #bca6d9;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.param-tag {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.image-id-row {
  margin-bottom: 2rem;
  font-size: 0.9rem;
  color: #bca6d9;
}

.download-btn {
  background: #ff7eb3; /* Pink button */
  border: none;
  color: #fff;
  font-weight: bold;
  padding: 0.8rem 2rem;
  border-radius: 25px;
  font-size: 1rem;
}

.download-btn:hover {
  background: #ff64a0;
}

.loading-state,
.error-state {
  padding: 3rem;
  text-align: center;
  color: #fff;
}
</style>
