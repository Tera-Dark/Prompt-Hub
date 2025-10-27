# Prompts Data Usage Guide

This guide explains how to work with prompts data in the Prompt Hub application.

## Overview

The prompts data system consists of:

1. **Data File**: `/public/data/prompts.json` - Contains all prompt entries
2. **Type Definitions**: `/src/types/prompt.ts` - TypeScript interfaces and utility functions
3. **Constants**: `/src/constants/categories.ts` - Predefined categories and metadata
4. **Composable**: `/src/composables/usePrompts.ts` - Vue composable for reactive prompt data
5. **Example Component**: `/src/components/PromptList.vue` - Demonstrates usage

## Quick Start

### Loading Prompts in a Component

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { usePrompts } from '@/composables/usePrompts';

const { prompts, loading, error, fetchPrompts } = usePrompts();

onMounted(() => {
  fetchPrompts();
});
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">{{ error }}</div>
  <div v-else>
    <div v-for="prompt in prompts" :key="prompt.id">
      <h3>{{ prompt.title }}</h3>
      <p>{{ prompt.description }}</p>
    </div>
  </div>
</template>
```

### Using Helper Functions

```typescript
import type { Prompt } from '@/types/prompt';
import { 
  loadPrompts,
  getPromptsByCategory,
  getPromptsByTag,
  searchPrompts
} from '@/types/prompt';

// Load all prompts
const data = await loadPrompts();
const allPrompts = data.prompts;

// Filter by category
const programmingPrompts = getPromptsByCategory(allPrompts, '编程');

// Filter by tag
const seoPrompts = getPromptsByTag(allPrompts, 'SEO');

// Search prompts
const results = searchPrompts(allPrompts, 'writing');
```

## Type Definitions

### `Prompt` Interface

```typescript
interface Prompt {
  id: string;              // Unique identifier
  title: string;           // Display title
  category: string;        // Category name
  tags: string[];          // Array of tags
  prompt: string;          // Actual prompt text
  description: string;     // User-facing description
  sourceLink?: string;     // Optional source URL
  createdAt: string;       // ISO 8601 datetime
  updatedAt?: string;      // Optional update datetime
}
```

### `PromptsData` Interface

```typescript
interface PromptsData {
  prompts: Prompt[];
  version: string;
}
```

## Available Utility Functions

### `loadPrompts(): Promise<PromptsData>`

Asynchronously loads prompts from `/data/prompts.json` with error handling.

```typescript
try {
  const data = await loadPrompts();
  console.log(`Loaded ${data.prompts.length} prompts`);
} catch (error) {
  if (error instanceof PromptLoadError) {
    console.error('Failed to load:', error.message);
  }
}
```

### `getPromptById(prompts: Prompt[], id: string): Prompt | undefined`

Find a specific prompt by its ID.

```typescript
const prompt = getPromptById(prompts, 'writing-001');
if (prompt) {
  console.log(prompt.title);
}
```

### `getPromptsByCategory(prompts: Prompt[], category: string): Prompt[]`

Filter prompts by category.

```typescript
const aiDrawingPrompts = getPromptsByCategory(prompts, 'AI绘画');
```

### `getPromptsByTag(prompts: Prompt[], tag: string): Prompt[]`

Filter prompts by tag.

```typescript
const codingPrompts = getPromptsByTag(prompts, '编程');
```

### `searchPrompts(prompts: Prompt[], query: string): Prompt[]`

Search prompts by title, description, prompt text, or tags.

```typescript
const results = searchPrompts(prompts, 'email');
```

### `getAllCategories(prompts: Prompt[]): string[]`

Get all unique categories from the prompts.

```typescript
const categories = getAllCategories(prompts);
// Returns: ['AI绘画', '写作', '编程', ...]
```

### `getAllTags(prompts: Prompt[]): string[]`

Get all unique tags from the prompts.

```typescript
const tags = getAllTags(prompts);
// Returns sorted array of all tags
```

## Using the Composable

The `usePrompts` composable provides reactive state management for prompts:

```typescript
import { usePrompts } from '@/composables/usePrompts';

const {
  prompts,           // Ref<Prompt[]> - reactive prompts array
  loading,           // Ref<boolean> - loading state
  error,             // Ref<string | null> - error message
  dataVersion,       // Ref<string> - data version
  categories,        // ComputedRef<string[]> - all categories
  tags,              // ComputedRef<string[]> - all tags
  fetchPrompts,      // () => Promise<void> - fetch data
  filterByCategory,  // (category: string) => Prompt[]
  filterByTag,       // (tag: string) => Prompt[]
  search             // (query: string) => Prompt[]
} = usePrompts();
```

## Working with Categories

Categories are defined in `/src/constants/categories.ts`:

```typescript
import { CATEGORIES, CATEGORY_DESCRIPTIONS, CATEGORY_ICONS } from '@/constants/categories';

// Use predefined category constants
const category = CATEGORIES.PROGRAMMING; // '编程'

// Get category description
const desc = CATEGORY_DESCRIPTIONS[CATEGORIES.PROGRAMMING];

// Get category icon
const icon = CATEGORY_ICONS[CATEGORIES.PROGRAMMING]; // '💻'
```

### Available Categories

- `CATEGORIES.AI_DRAWING` - AI绘画 🎨
- `CATEGORIES.WRITING` - 写作 ✍️
- `CATEGORIES.PROGRAMMING` - 编程 💻
- `CATEGORIES.PRODUCTIVITY` - 效率提升 ⚡
- `CATEGORIES.TRANSLATION` - 翻译 🌐
- `CATEGORIES.EDUCATION` - 教育 📚
- `CATEGORIES.MARKETING` - 营销 📢
- `CATEGORIES.ANALYSIS` - 分析 📊

## Error Handling

The system uses a custom `PromptLoadError` for better error handling:

```typescript
import { loadPrompts, PromptLoadError } from '@/types/prompt';

try {
  const data = await loadPrompts();
} catch (error) {
  if (error instanceof PromptLoadError) {
    // Handle specific prompt loading errors
    console.error('Load error:', error.message);
    if (error.cause) {
      console.error('Caused by:', error.cause);
    }
  } else {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
  }
}
```

## Best Practices

1. **Use the Composable**: For Vue components, prefer `usePrompts()` over direct API calls
2. **Error Handling**: Always handle loading and error states in your UI
3. **Type Safety**: Import and use TypeScript types from `@/types/prompt`
4. **Constants**: Use category constants from `@/constants/categories` instead of hardcoding strings
5. **Performance**: Cache loaded prompts at the app level if needed
6. **Validation**: The loader validates data structure automatically

## Example: Building a Filter Component

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePrompts } from '@/composables/usePrompts';
import { CATEGORIES } from '@/constants/categories';

const { prompts, categories, filterByCategory } = usePrompts();
const selectedCategory = ref<string | null>(null);

const filteredPrompts = computed(() => {
  if (!selectedCategory.value) return prompts.value;
  return filterByCategory(selectedCategory.value);
});
</script>

<template>
  <div>
    <select v-model="selectedCategory">
      <option :value="null">All Categories</option>
      <option v-for="cat in categories" :key="cat" :value="cat">
        {{ cat }}
      </option>
    </select>

    <div v-for="prompt in filteredPrompts" :key="prompt.id">
      <h3>{{ prompt.title }}</h3>
    </div>
  </div>
</template>
```

## Development vs Production

The data file is located in `/public/data/prompts.json`, which means:

- **Development**: Accessible at `http://localhost:5173/data/prompts.json`
- **Production**: Will be available at the configured base URL
- The loader automatically handles the fetch based on the environment

## Troubleshooting

### Prompts not loading?

1. Check browser console for error messages
2. Verify `/public/data/prompts.json` exists and is valid JSON
3. Check network tab to see if the fetch is successful
4. Ensure the JSON structure matches the schema

### TypeScript errors?

1. Make sure path aliases are configured in `tsconfig.json` and `vite.config.ts`
2. Restart the TypeScript server in your IDE
3. Verify imports use `@/` prefix for src files

### Empty prompts array?

1. Check if `fetchPrompts()` was called
2. Verify the JSON file has a valid `prompts` array
3. Check for errors in the error state

## Further Reading

- [Data Schema Documentation](/public/data/README.md)
- [Vue Composition API](https://vuejs.org/guide/reusability/composables.html)
- [TypeScript Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
