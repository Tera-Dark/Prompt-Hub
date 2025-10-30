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

The project is configured to deploy to GitHub Pages with the base path `/Prompt-Hub/`. The repository ships with a streamlined workflow (`.github/workflows/deploy.yml`) that builds the Vite application and deploys it directly with `actions/deploy-pages@v4`.

### 🛠️ Workflow overview

- Triggered automatically on pushes to the `main` branch or manually via **Run workflow**
- Steps: checkout, set up Node 20 with npm caching, install dependencies with `npm ci`, build with `npm run build`, upload the `dist` folder, and deploy with `actions/deploy-pages@v4`
- No `actions/configure-pages` step is required; deployment happens in a single job

### 📝 First-time deployment checklist

⚠️ **Important:** Complete these steps before the first workflow run:

1. Navigate to **Settings → Pages**
2. Under **Source**, choose **GitHub Actions** and save
3. If you encounter permission errors, go to **Settings → Actions → General** and set **Workflow permissions** to **Read and write**

After this one-time setup, pushing to `main` will automatically publish the site.

### Troubleshooting

- If a run fails with `Resource not accessible by integration`, double-check the workflow permissions described above
- View detailed logs in the **Actions** tab to confirm the build, artifact upload, and deployment steps

Once deployed, the site will be available at: `https://tera-dark.github.io/Prompt-Hub/`

### Build configuration

`vite.config.ts` uses the GitHub Pages base path:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  base: '/Prompt-Hub/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

### Package scripts

`package.json` provides the standard Vite scripts used by the workflow:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "validate:prompts": "node scripts/validate-prompts.js"
  }
}
```
