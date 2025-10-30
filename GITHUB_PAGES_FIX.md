# GitHub Pages Deployment Fix

## Summary

This document describes the fix applied to ensure the Prompt-Hub project deploys successfully to GitHub Pages.

## Issue Identified

The application was loading the prompts data file using an absolute path:
```typescript
fetch('/data/prompts.json')
```

This works fine in development mode (with base path `/`), but fails in production when deployed to GitHub Pages with base path `/Prompt-Hub/`. The browser would try to fetch from:
- ❌ `https://tera-dark.github.io/data/prompts.json` (incorrect)

Instead of:
- ✅ `https://tera-dark.github.io/Prompt-Hub/data/prompts.json` (correct)

## Fix Applied

Updated the `loadPrompts()` function in `src/types/prompt.ts` to use Vite's `BASE_URL` environment variable:

```typescript
// Before
const response = await fetch('/data/prompts.json');

// After
const response = await fetch(`${import.meta.env.BASE_URL}data/prompts.json`);
```

This ensures the correct path is used in both environments:
- Development: `http://localhost:5173/data/prompts.json`
- Production: `https://tera-dark.github.io/Prompt-Hub/data/prompts.json`

## Verification Status

✅ **PR Merge Status**
- PR #1: Init Vite project - Merged
- PR #2: Define prompts data - Merged
- PR #3: Build prompt explorer - Merged
- PR #5: Configure Pages deploy - Merged

✅ **Vite Configuration**
- Base path correctly set to `/Prompt-Hub/` in production
- Base path set to `/` for development
- Configuration in `vite.config.ts` is correct

✅ **GitHub Actions Workflow**
- Workflow file: `.github/workflows/deploy.yml`
- Triggers: Push to `main` branch + manual dispatch
- Permissions: Correctly set (contents: read, pages: write, id-token: write)
- Build steps: Complete and correct
- Node version: 20 (LTS)
- Deployment method: Modern GitHub Pages Actions (upload-pages-artifact + deploy-pages)

✅ **Build Testing**
- Production build completes successfully
- All assets use correct base path `/Prompt-Hub/`
- TypeScript compilation passes without errors
- Data files are included in build output

✅ **Documentation**
- README.md contains comprehensive GitHub Pages setup instructions
- Instructions explain how to enable GitHub Actions as deployment source

## Build Output Verification

Production build output shows correct asset paths:
```html
<link rel="icon" type="image/svg+xml" href="/Prompt-Hub/vite.svg" />
<script type="module" crossorigin src="/Prompt-Hub/assets/index-*.js"></script>
<link rel="stylesheet" crossorigin href="/Prompt-Hub/assets/index-*.css">
```

Directory structure:
```
dist/
├── assets/          # JS and CSS bundles
├── data/            # Prompts data files
│   ├── prompts.json
│   └── README.md
├── index.html       # Entry point
└── vite.svg         # Favicon
```

## Next Steps (Manual Configuration Required)

To complete the GitHub Pages setup, the repository owner must:

1. Go to the repository on GitHub: `https://github.com/Tera-Dark/Prompt-Hub`
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions** from the dropdown
4. Save the settings
5. Push changes to the `main` branch to trigger the first deployment

The workflow will automatically:
- Install dependencies
- Run TypeScript type checking
- Build the Vite application
- Upload the static files
- Deploy to GitHub Pages

## Deployment URL

Once deployed, the application will be accessible at:
**https://tera-dark.github.io/Prompt-Hub/**

## Testing Recommendations

After deployment, verify:
1. The homepage loads correctly
2. Prompts data is fetched and displayed
3. Search functionality works
4. Category filtering works
5. All assets (CSS, JS, images) load without 404 errors
6. No console errors related to asset loading

## Technical Details

### Environment Variables
- `import.meta.env.BASE_URL` - Provided by Vite, reflects the `base` config
- `import.meta.env.NODE_ENV` - Set to "production" during build
- `import.meta.env.DEV` - True in development mode
- `import.meta.env.PROD` - True in production mode

### Base Path Configuration
The base path is configured in `vite.config.ts`:
```typescript
base: process.env.NODE_ENV === 'production' ? '/Prompt-Hub/' : '/'
```

This conditional ensures:
- Local development uses root path for simplicity
- Production builds use the GitHub Pages repository path

### Asset Reference Best Practices
- Static assets in `public/` are copied as-is to `dist/`
- Use `import.meta.env.BASE_URL` for dynamic asset loading
- Imported assets (via `import`) are automatically handled by Vite
- HTML asset references are automatically rewritten during build
