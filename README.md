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

### Automatic Deployment

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys the application to GitHub Pages when changes are pushed to the `main` branch.

The workflow is configured to **automatically enable GitHub Pages** using the `enablement: true` parameter, so in most cases, no manual setup is required.

### Initial Setup (One-time Configuration)

The workflow should automatically enable GitHub Pages on first run. However, if you encounter errors or need to manually configure it:

#### Steps to Manually Enable GitHub Pages:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. In the **Build and deployment** section:
   - **Source**: Select **GitHub Actions** from the dropdown
   - This tells GitHub to use the workflow file for deployment instead of a branch
4. Save the settings
5. Push changes to the `main` branch to trigger deployment

#### Troubleshooting

If you see errors like "Get Pages site failed" or "Not Found":

1. **Verify Pages is enabled**: Check that Settings → Pages shows "GitHub Actions" as the source
2. **Check workflow permissions**: The workflow requires:
   - `contents: read`
   - `pages: write`
   - `id-token: write`
   
   These are already configured in the workflow file.

3. **First deployment may take a few minutes**: The initial deployment can take longer to propagate

4. **Check Actions tab**: View the workflow runs in the Actions tab to see detailed logs

#### How the Deployment Works

The workflow will:
- Install dependencies (using npm ci with dependency caching for faster builds)
- Run the TypeScript compiler and build the Vite application
- Upload the built static files from the `dist` folder
- Deploy to GitHub Pages using the modern `actions/upload-pages-artifact` + `actions/deploy-pages` flow

Once deployed, the site will be available at: `https://tera-dark.github.io/Prompt-Hub/`

### Build Configuration

The production build is configured in `vite.config.ts` to use the base path `/Prompt-Hub/`:

```typescript
base: process.env.NODE_ENV === 'production' ? '/Prompt-Hub/' : '/'
```

This ensures all assets and routes are correctly resolved when deployed to GitHub Pages.

### Node.js Version

The workflow uses Node.js 20 (LTS) and caches npm dependencies for optimal build performance.
