# Component Architecture

## Component Hierarchy

```
App.vue (Root Component)
├── Header
│   ├── Title: "Prompt Hub"
│   └── Subtitle
│
├── Main Content
│   ├── Controls Section (white card container)
│   │   ├── SearchBar.vue
│   │   │   ├── Search Icon (SVG)
│   │   │   ├── Input Field (v-model: searchQuery)
│   │   │   └── Clear Button (conditional)
│   │   │
│   │   └── CategoryFilter.vue
│   │       ├── Filter Label + Result Count
│   │       └── Category Pills
│   │           ├── "All" Pill
│   │           └── Category Pills (with icons)
│   │               - emits: update:selectedCategory
│   │
│   └── PromptList.vue
│       ├── Loading State (if loading)
│       │   └── Spinner + Text
│       │
│       ├── Error State (if error)
│       │   ├── Error Icon (SVG)
│       │   ├── Error Message
│       │   └── Retry Button
│       │
│       ├── Empty State (if no results)
│       │   ├── Search Icon (SVG)
│       │   ├── "No prompts found" Message
│       │   └── Helpful Text
│       │
│       └── Prompt Grid (if has prompts)
│           └── PromptCard.vue (for each prompt)
│               ├── Card Header
│               │   ├── Title
│               │   └── Category Badge
│               │
│               ├── Description
│               │
│               ├── Prompt Code Block
│               │   └── Prompt Text (monospace)
│               │
│               ├── Tags Container
│               │   └── Tag Pills
│               │
│               └── Card Footer
│                   ├── Copy Button
│                   │   ├── Copy/Check Icon (SVG)
│                   │   └── "Copy"/"Copied!" Text
│                   │
│                   └── Source Link (conditional)
│
└── Footer
    └── Copyright Text
```

## Data Flow

```
┌─────────────────────────────────────────────────┐
│ usePrompts Composable                           │
│  - fetchPrompts(): loads /data/prompts.json     │
│  - prompts: Ref<Prompt[]>                       │
│  - loading: Ref<boolean>                        │
│  - error: Ref<string|null>                      │
│  - categories: computed from prompts            │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ App.vue (State Management)                      │
│  - searchQuery: ref('')                         │
│  - selectedCategory: ref(null)                  │
│  - filteredPrompts: computed(() => {            │
│      // Filter by category                      │
│      // Filter by search query                  │
│    })                                           │
└─────────────────────────────────────────────────┘
                     ↓
        ┌───────────┴───────────┐
        ↓                       ↓
┌───────────────┐      ┌──────────────────┐
│ SearchBar     │      │ CategoryFilter   │
│ v-model       │      │ @update          │
│ searchQuery   │      │ selectedCategory │
└───────────────┘      └──────────────────┘
                     ↓
         ┌──────────────────────┐
         │ PromptList           │
         │ :prompts (filtered)  │
         │ :loading             │
         │ :error               │
         └──────────────────────┘
                     ↓
         ┌──────────────────────┐
         │ PromptCard           │
         │ :prompt              │
         │ - copyToClipboard()  │
         └──────────────────────┘
```

## Component Props & Events

### SearchBar.vue
**Props:**
- `modelValue: string` - Current search query

**Events:**
- `update:modelValue(value: string)` - Emitted when search text changes

### CategoryFilter.vue
**Props:**
- `categories: string[]` - List of available categories
- `resultCount?: number` - Number of filtered results
- `showCount?: boolean` - Whether to display result count

**Events:**
- `update:selectedCategory(category: string | null)` - Emitted when category selected

### PromptList.vue
**Props:**
- `prompts: Prompt[]` - Array of prompts to display
- `loading?: boolean` - Loading state
- `error?: string | null` - Error message

**Events:**
- `retry()` - Emitted when retry button clicked

### PromptCard.vue
**Props:**
- `prompt: Prompt` - Prompt data object

**Events:**
- None (self-contained component)

**Internal State:**
- `isCopied: ref(boolean)` - Tracks copy feedback state

## Styling System

### CSS Variables (from style.css)
```css
/* Colors */
--color-gray-900 to --color-gray-50
--color-white, --color-black

/* Spacing */
--space-xs to --space-2xl

/* Typography */
--text-xs to --text-3xl

/* Transitions */
--transition-fast, --transition-base, --transition-slow

/* Shadows */
--shadow-sm, --shadow-md, --shadow-lg

/* Border Radius */
--radius-sm, --radius-md, --radius-lg
```

### Responsive Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 768px
- **Desktop**: 768px - 1400px
- **Large Desktop**: > 1400px

## Key Features

### 1. Search Functionality
- Real-time filtering as user types
- Searches across: title, description, prompt, tags
- Case-insensitive matching
- No API calls (client-side filtering)

### 2. Category Filtering
- Pill-based selection (not dropdown)
- "All" option to clear filter
- Shows category icons from constants
- Combined with search (both filters applied)

### 3. Copy Mechanism
```javascript
// Primary method (modern browsers)
await navigator.clipboard.writeText(text)

// Fallback method (older browsers)
document.execCommand('copy')

// Visual feedback
isCopied.value = true
setTimeout(() => isCopied.value = false, 2000)
```

### 4. Responsive Grid
```css
/* Desktop: auto-fill grid */
grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));

/* Mobile: single column */
@media (max-width: 768px) {
  grid-template-columns: 1fr;
}
```

### 5. State Management
- Uses Vue 3 Composition API
- Reactive refs for user input
- Computed properties for derived state
- Proper TypeScript typing throughout

## Performance Optimizations

1. **Client-side filtering**: No API calls for search/filter
2. **CSS Grid**: Hardware-accelerated layout
3. **Scoped styles**: No style conflicts
4. **Lazy animations**: Only on visible elements
5. **Efficient re-renders**: Vue's reactivity system
6. **Code splitting**: Vite's optimized bundling

## Accessibility Features

1. **Keyboard Navigation**: All interactive elements are focusable
2. **ARIA Labels**: Copy buttons have descriptive labels
3. **Focus Indicators**: Visible outlines on focus
4. **Semantic HTML**: Proper use of article, button, etc.
5. **Color Contrast**: WCAG AA compliant
6. **Screen Reader Friendly**: Meaningful text content
