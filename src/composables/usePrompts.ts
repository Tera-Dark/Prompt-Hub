import { ref, computed, type Ref } from 'vue';
import type { Prompt, PromptsData } from '@/types/prompt';
import { 
  loadPrompts, 
  PromptLoadError,
  getPromptsByCategory,
  getPromptsByTag,
  searchPrompts,
  getAllCategories,
  getAllTags
} from '@/types/prompt';

export function usePrompts() {
  const prompts: Ref<Prompt[]> = ref([]);
  const loading = ref(false);
  const error: Ref<string | null> = ref(null);
  const dataVersion = ref('');

  const categories = computed(() => getAllCategories(prompts.value));
  const tags = computed(() => getAllTags(prompts.value));

  async function fetchPrompts() {
    loading.value = true;
    error.value = null;

    try {
      const data: PromptsData = await loadPrompts();
      prompts.value = data.prompts;
      dataVersion.value = data.version;
    } catch (err) {
      if (err instanceof PromptLoadError) {
        error.value = err.message;
        console.error('Failed to load prompts:', err.message, err.cause);
      } else {
        error.value = 'An unexpected error occurred while loading prompts';
        console.error('Unexpected error:', err);
      }
      prompts.value = [];
    } finally {
      loading.value = false;
    }
  }

  function filterByCategory(category: string): Prompt[] {
    return getPromptsByCategory(prompts.value, category);
  }

  function filterByTag(tag: string): Prompt[] {
    return getPromptsByTag(prompts.value, tag);
  }

  function search(query: string): Prompt[] {
    return searchPrompts(prompts.value, query);
  }

  return {
    prompts,
    loading,
    error,
    dataVersion,
    categories,
    tags,
    fetchPrompts,
    filterByCategory,
    filterByTag,
    search
  };
}
