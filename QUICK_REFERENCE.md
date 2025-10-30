# Prompts Data Quick Reference

## 🚀 Quick Start

```typescript
// In your Vue component
import { usePrompts } from '@/composables/usePrompts';

const { prompts, loading, error, fetchPrompts } = usePrompts();
await fetchPrompts();
```

## 📦 Imports

```typescript
// Types
import type { Prompt, PromptsData } from '@/types/prompt';

// Helper Functions
import { 
  loadPrompts,
  getPromptById,
  getPromptsByCategory,
  getPromptsByTag,
  searchPrompts,
  getAllCategories,
  getAllTags
} from '@/types/prompt';

// Constants
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_DESCRIPTIONS } from '@/constants/categories';

// Composable
import { usePrompts } from '@/composables/usePrompts';
```

## 🔧 Common Operations

### Load Prompts
```typescript
const data = await loadPrompts();
const allPrompts = data.prompts;
```

### Filter by Category
```typescript
const writingPrompts = getPromptsByCategory(prompts, '写作');
// or use constant
const writingPrompts = getPromptsByCategory(prompts, CATEGORIES.WRITING);
```

### Filter by Tag
```typescript
const seoPrompts = getPromptsByTag(prompts, 'SEO');
```

### Search
```typescript
const results = searchPrompts(prompts, 'email');
```

### Find by ID
```typescript
const prompt = getPromptById(prompts, 'writing-001');
```

### Get All Categories/Tags
```typescript
const categories = getAllCategories(prompts);
const tags = getAllTags(prompts);
```

## 🎯 Categories

```typescript
CATEGORIES.AI_DRAWING     // 'AI绘画' 🎨
CATEGORIES.WRITING        // '写作'   ✍️
CATEGORIES.PROGRAMMING    // '编程'   💻
CATEGORIES.PRODUCTIVITY   // '效率提升' ⚡
CATEGORIES.TRANSLATION    // '翻译'   🌐
CATEGORIES.EDUCATION      // '教育'   📚
CATEGORIES.MARKETING      // '营销'   📢
CATEGORIES.ANALYSIS       // '分析'   📊
```

## 📋 Data Structure

```typescript
interface Prompt {
  id: string;              // 'writing-001'
  title: string;           // 'Professional Email Refinement'
  category: string;        // '写作'
  tags: string[];          // ['email', 'business']
  prompt: string;          // The actual prompt text
  description: string;     // User-facing description
  sourceLink?: string;     // Optional source URL
  createdAt: string;       // '2024-01-15T10:30:00Z'
  updatedAt?: string;      // Optional update timestamp
}
```

## 🛠️ CLI Commands

```bash
# Validate prompts data
npm run validate:prompts

# Build (includes type check)
npm run build

# Dev server
npm run dev
```

## 📁 File Locations

- **Data**: `/public/data/prompts.json`
- **Types**: `/src/types/prompt.ts`
- **Constants**: `/src/constants/categories.ts`
- **Composable**: `/src/composables/usePrompts.ts`
- **Docs**: 
  - `/document/DATA_SCHEMA.md` (Schema)
  - `/document/DEVELOPMENT.md` (Development Guide)

## ⚠️ Error Handling

```typescript
import { PromptLoadError } from '@/types/prompt';

try {
  const data = await loadPrompts();
} catch (error) {
  if (error instanceof PromptLoadError) {
    console.error('Load error:', error.message);
  }
}
```

## 💡 Best Practices

1. ✅ Use `usePrompts()` composable in Vue components
2. ✅ Use category constants instead of hardcoded strings
3. ✅ Always handle loading and error states
4. ✅ Import types from `@/types` for type safety
5. ✅ Validate data with `npm run validate:prompts`
6. ✅ Keep prompts.json sorted by category and ID

## 📚 Full Documentation

- [数据结构文档](document/DATA_SCHEMA.md)
- [开发指南](document/DEVELOPMENT.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
