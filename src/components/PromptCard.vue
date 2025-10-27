<template>
  <article class="prompt-card">
    <div class="card-header">
      <h3 class="card-title">{{ prompt.title }}</h3>
      <span class="category-badge">{{ prompt.category }}</span>
    </div>
    
    <p class="card-description">{{ prompt.description }}</p>
    
    <div class="card-prompt">
      <code class="prompt-text">{{ prompt.prompt }}</code>
    </div>
    
    <div class="card-tags">
      <span 
        v-for="tag in prompt.tags" 
        :key="tag" 
        class="tag"
      >
        {{ tag }}
      </span>
    </div>
    
    <div class="card-footer">
      <button 
        class="copy-button"
        :class="{ 'copied': isCopied }"
        @click="copyToClipboard"
        :aria-label="isCopied ? 'Copied!' : 'Copy prompt'"
      >
        <span class="copy-icon" v-if="!isCopied">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </span>
        <span class="check-icon" v-else>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
        <span class="copy-text">{{ isCopied ? 'Copied!' : 'Copy' }}</span>
      </button>
      
      <a 
        v-if="prompt.sourceLink" 
        :href="prompt.sourceLink" 
        target="_blank" 
        rel="noopener noreferrer"
        class="source-link"
      >
        Source
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Prompt } from '@/types/prompt';

interface Props {
  prompt: Prompt;
}

const props = defineProps<Props>();
const isCopied = ref(false);

async function copyToClipboard() {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(props.prompt.prompt);
      showCopiedFeedback();
    } else {
      fallbackCopy(props.prompt.prompt);
    }
  } catch (err) {
    console.error('Failed to copy:', err);
    fallbackCopy(props.prompt.prompt);
  }
}

function fallbackCopy(text: string) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    showCopiedFeedback();
  } catch (err) {
    console.error('Fallback copy failed:', err);
    alert('Copy failed. Please copy manually.');
  } finally {
    document.body.removeChild(textArea);
  }
}

function showCopiedFeedback() {
  isCopied.value = true;
  setTimeout(() => {
    isCopied.value = false;
  }, 2000);
}
</script>

<style scoped>
.prompt-card {
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  animation: fadeIn 0.3s ease;
}

.prompt-card:hover {
  border-color: var(--color-gray-400);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.card-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-gray-900);
  flex: 1;
  line-height: 1.4;
}

.category-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: var(--color-gray-900);
  color: var(--color-white);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.card-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-gray-600);
  line-height: 1.6;
}

.card-prompt {
  background-color: var(--color-gray-100);
  border: 1px solid var(--color-gray-200);
  border-radius: 4px;
  padding: 0.75rem;
  overflow-x: auto;
  max-height: 150px;
  overflow-y: auto;
}

.prompt-text {
  display: block;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.813rem;
  color: var(--color-gray-800);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  background-color: var(--color-gray-200);
  color: var(--color-gray-700);
  border-radius: 3px;
  font-size: 0.75rem;
  transition: background-color 0.15s ease;
}

.tag:hover {
  background-color: var(--color-gray-300);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-gray-200);
  margin-top: auto;
}

.copy-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--color-gray-900);
  color: var(--color-white);
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-button:hover {
  background-color: var(--color-gray-800);
  transform: translateY(-1px);
}

.copy-button:active {
  transform: translateY(0);
}

.copy-button.copied {
  background-color: var(--color-gray-700);
  pointer-events: none;
}

.copy-icon,
.check-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.copy-text {
  font-weight: 500;
}

.source-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.813rem;
  color: var(--color-gray-600);
  transition: color 0.15s ease;
  text-decoration: none;
}

.source-link:hover {
  color: var(--color-gray-900);
}

.source-link:focus {
  outline: 2px solid var(--color-gray-400);
  outline-offset: 2px;
  border-radius: 2px;
}

@media (max-width: 640px) {
  .prompt-card {
    padding: 1rem;
  }

  .card-title {
    font-size: 1rem;
  }

  .card-footer {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }

  .copy-button {
    justify-content: center;
  }

  .source-link {
    text-align: center;
    justify-content: center;
  }
}
</style>
