# Prompt Hub

A Vue 3 + Vite application for exploring and managing AI prompts.

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
├── public/
│   └── data/
│       ├── prompts.json        # Prompts data file
│       └── README.md           # Data schema documentation
├── src/
│   ├── components/
│   │   └── PromptList.vue      # Example component for displaying prompts
│   ├── composables/
│   │   └── usePrompts.ts       # Vue composable for prompts data
│   ├── constants/
│   │   └── categories.ts       # Category constants and metadata
│   ├── types/
│   │   └── prompt.ts           # TypeScript types and utility functions
│   ├── utils/
│   │   └── validatePrompts.ts  # Data validation utilities
│   ├── App.vue                 # Root component
│   ├── main.ts                 # Application entry point
│   ├── style.css               # Global styles
│   └── PROMPTS_USAGE.md        # Developer guide for working with prompts
├── index.html                  # HTML entry point
├── vite.config.ts              # Vite configuration
└── tsconfig.json               # TypeScript configuration
```

## Prompts Data

The application uses a JSON-based data system for managing AI prompts. Key features:

- **Schema**: Structured JSON schema for prompt entries with validation
- **Categories**: Predefined categories (AI绘画, 写作, 编程, etc.) with icons and descriptions
- **TypeScript Support**: Full type definitions for type-safe development
- **Helper Functions**: Utilities for loading, filtering, and searching prompts
- **Vue Composable**: Reactive state management with `usePrompts()`

### Quick Start

```typescript
import { usePrompts } from '@/composables/usePrompts';

const { prompts, loading, error, fetchPrompts } = usePrompts();
fetchPrompts();
```

### Documentation

- 📘 [Data Schema Documentation](public/data/README.md) - JSON schema, field requirements, and contribution guidelines
- 📗 [Developer Usage Guide](src/PROMPTS_USAGE.md) - How to use prompts in your components

## GitHub Pages Deployment

The project is configured to deploy to GitHub Pages with the base path `/Prompt-Hub/`.
