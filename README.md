# Prompt Hub 🚀

A beautiful, modern web application for discovering, managing, and sharing AI prompts. Built with Vue 3 and TypeScript, Prompt Hub makes it easy to explore a curated collection of high-quality prompts across multiple categories.

[![Deploy Status](https://img.shields.io/badge/deploy-GitHub%20Pages-success)](https://github.com/username/Prompt-Hub)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**🌐 Live Demo:** [https://username.github.io/Prompt-Hub/](https://username.github.io/Prompt-Hub/) *(Coming Soon)*

---

## ✨ Features

- **📚 Curated Prompt Library**: Professionally organized collection of AI prompts across 8 categories
- **🔍 Smart Search & Filter**: Quickly find prompts by category, tags, or keywords
- **🌏 Bilingual Support**: Prompts and descriptions in both English and Chinese
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **⚡ Fast & Lightweight**: Built with Vite for instant loading and optimal performance
- **🎨 Modern UI**: Clean, intuitive interface for browsing and copying prompts
- **🆓 Zero-Cost Hosting**: Deployed on GitHub Pages with no server costs
- **🤝 Community-Driven**: Open for contributions via GitHub issues

---

## 📋 Categories

Prompts are organized into the following categories:

| Category | Icon | Description |
|----------|------|-------------|
| AI绘画 | 🎨 | AI image generation and optimization prompts |
| 写作 | ✍️ | Writing, editing, and content creation |
| 编程 | 💻 | Programming, debugging, and code optimization |
| 效率提升 | ⚡ | Productivity and efficiency boosters |
| 翻译 | 🌐 | Translation and language conversion |
| 教育 | 📚 | Teaching and learning assistance |
| 营销 | 📢 | Marketing copy and strategy |
| 分析 | 📊 | Data analysis and research |

---

## 🛠️ Tech Stack

- **Frontend Framework**: [Vue 3](https://vuejs.org/) with Composition API
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type safety
- **Build Tool**: [Vite](https://vitejs.dev/) for lightning-fast development
- **Styling**: CSS3 with custom properties
- **Data Storage**: JSON-based data structure
- **Hosting**: GitHub Pages (zero-cost)
- **Version Control**: Git & GitHub

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/username/Prompt-Hub.git
   cd Prompt-Hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:5173`

4. **View in browser**
   Open your browser and navigate to the local development URL

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run validate:prompts` | Validate prompts JSON data schema |

---

## 📦 Build & Deploy

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Deploying to GitHub Pages

**Automatic Deployment (Recommended)**

The project is configured to deploy automatically to GitHub Pages. Once a GitHub Actions workflow is set up, every push to the `main` branch will trigger an automatic deployment.

**Manual Deployment**

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist/` directory to the `gh-pages` branch:
   ```bash
   git subtree push --prefix dist origin gh-pages
   ```

3. Enable GitHub Pages in your repository settings:
   - Go to Settings → Pages
   - Source: Deploy from branch `gh-pages`
   - Folder: `/ (root)`

**Deployment URL**: `https://<username>.github.io/Prompt-Hub/`

> **💰 Cost**: GitHub Pages hosting is completely free for public repositories!

---

## 📊 Data Structure

Prompts are stored in a structured JSON format at `public/data/prompts.json`.

### Prompt Schema

```typescript
interface Prompt {
  id: string;              // Unique ID (e.g., "writing-001")
  title: string;           // Display title
  category: string;        // Category name
  tags: string[];          // Array of tags for filtering
  prompt: string;          // The actual prompt text
  description: string;     // User-facing description
  sourceLink?: string;     // Optional source URL
  createdAt: string;       // ISO 8601 datetime
  updatedAt?: string;      // Optional update datetime
}
```

### Example Entry

```json
{
  "id": "writing-001",
  "title": "Blog Post Title Generator",
  "category": "写作",
  "tags": ["blog", "title", "SEO", "creative"],
  "prompt": "Generate 10 catchy, SEO-friendly blog post titles about [topic]...",
  "description": "生成吸引人的博客文章标题，优化SEO并提高点击率。",
  "createdAt": "2024-01-30T10:00:00Z"
}
```

### Documentation

- 📘 **[Data Schema Documentation](public/data/README.md)** - Detailed schema, validation rules, and contribution guidelines
- 📗 **[Developer Usage Guide](src/PROMPTS_USAGE.md)** - How to use prompts in your Vue components

---

## 🤝 Contributing

We welcome contributions from the community! Whether you want to submit new prompts, fix bugs, or improve documentation, your help is appreciated.

### How to Contribute

#### 🎯 Submit New Prompts (Recommended)

The easiest way to contribute is by submitting new prompts via GitHub Issues:

1. Go to the **[Issues](https://github.com/username/Prompt-Hub/issues)** tab
2. Click **"New Issue"**
3. Select the **"📝 New Prompt Submission"** template
4. Fill in all required fields (title, category, tags, prompt content, etc.)
5. Submit the issue

Our maintainers will review your submission and add it to the prompt database if approved.

#### 💻 Code Contributions

For code changes, bug fixes, or feature improvements:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run validation: `npm run validate:prompts`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

#### 📖 Documentation Improvements

Found a typo or want to improve documentation? Feel free to submit a PR directly!

### Contribution Guidelines

Please read our **[CONTRIBUTING.md](CONTRIBUTING.md)** for detailed guidelines on:
- Prompt submission standards
- Code style and conventions
- Review process and timelines
- How maintainers process submissions

---

## 📁 Project Structure

```
Prompt-Hub/
├── public/
│   └── data/
│       ├── prompts.json          # Main prompts data file
│       └── README.md             # Data schema documentation
├── src/
│   ├── components/               # Vue components
│   ├── composables/              # Vue composition utilities
│   │   └── usePrompts.ts         # Prompts data management
│   ├── constants/                # App constants
│   │   └── categories.ts         # Category definitions
│   ├── types/                    # TypeScript type definitions
│   │   └── prompt.ts             # Prompt types and utilities
│   ├── utils/                    # Utility functions
│   ├── App.vue                   # Root component
│   ├── main.ts                   # Application entry point
│   └── style.css                 # Global styles
├── scripts/
│   └── validate-prompts.js       # Prompt data validation script
├── .github/
│   └── ISSUE_TEMPLATE/
│       └── new-prompt.yml        # Prompt submission template
├── index.html                    # HTML entry point
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Project dependencies
├── CONTRIBUTING.md               # Contribution guidelines
└── README.md                     # This file
```

---

## 🔧 Development

### Using Prompts in Components

```typescript
import { usePrompts } from '@/composables/usePrompts';

export default {
  setup() {
    const { prompts, loading, error, fetchPrompts } = usePrompts();
    
    // Load prompts on mount
    onMounted(() => fetchPrompts());
    
    return { prompts, loading, error };
  }
}
```

### Filtering and Searching

```typescript
import { getPromptsByCategory, searchPrompts } from '@/types/prompt';

// Filter by category
const writingPrompts = getPromptsByCategory(prompts.value, '写作');

// Search prompts
const results = searchPrompts(prompts.value, 'SEO');
```

### Validation

Before committing changes to `prompts.json`, run the validation script:

```bash
npm run validate:prompts
```

This ensures:
- Valid JSON syntax
- All required fields are present
- Unique IDs across all prompts
- Valid category names
- Proper date formats
- Valid URLs for source links

---

## 🐛 Reporting Issues

Found a bug or have a suggestion? Please [open an issue](https://github.com/username/Prompt-Hub/issues/new) with:
- Clear description of the problem
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots (if applicable)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- All contributors who have submitted prompts and improvements
- The Vue.js and Vite communities for excellent tooling
- GitHub for free hosting via GitHub Pages

---

## 📮 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/username/Prompt-Hub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/username/Prompt-Hub/discussions)
- **Pull Requests**: [GitHub PRs](https://github.com/username/Prompt-Hub/pulls)

---

**Made with ❤️ by the open source community**

*Empowering everyone with high-quality AI prompts*
