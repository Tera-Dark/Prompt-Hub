# Contributing to Prompt Hub

Thank you for your interest in contributing to Prompt Hub! We welcome contributions from everyone, whether you're submitting new prompts, fixing bugs, improving documentation, or adding new features.

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Submitting New Prompts](#submitting-new-prompts)
- [Code Contributions](#code-contributions)
- [Maintainer Review Process](#maintainer-review-process)
- [Development Guidelines](#development-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Community Guidelines](#community-guidelines)

---

## Ways to Contribute

### 🎯 Submit New Prompts (No Coding Required!)

The easiest and most valuable way to contribute is by sharing high-quality AI prompts. See the [Submitting New Prompts](#submitting-new-prompts) section below.

### 💻 Code Contributions

Help improve the application by:
- Fixing bugs
- Adding new features
- Improving performance
- Enhancing the UI/UX
- Writing tests

### 📖 Documentation

Improve our documentation by:
- Fixing typos or unclear explanations
- Adding examples
- Translating content
- Creating tutorials

### 🐛 Report Bugs

Found a bug? [Open an issue](https://github.com/username/Prompt-Hub/issues/new) with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Browser/environment details

---

## Submitting New Prompts

### Via GitHub Issues (Recommended) 📝

This is the easiest method and doesn't require any coding knowledge:

1. **Go to the Issues tab**
   - Navigate to [github.com/username/Prompt-Hub/issues](https://github.com/username/Prompt-Hub/issues)

2. **Create a new issue**
   - Click the "New Issue" button
   - Select the "📝 New Prompt Submission" template

3. **Fill in the form**
   - **Title**: Short, descriptive name (e.g., "Blog Title Generator")
   - **Category**: Select from the dropdown (AI绘画, 写作, 编程, etc.)
   - **Tags**: 2-8 relevant tags (comma-separated)
   - **Prompt Content**: The actual prompt text with clear instructions
   - **Description**: Brief explanation of what it does and when to use it
   - **Usage Tips**: (Optional) Tips for best results
   - **Source Link**: (Optional) URL if adapted from elsewhere
   - **Attribution**: How to credit this submission
   - **Checklist**: Confirm all requirements

4. **Submit**
   - Review your submission and click "Submit new issue"

### Via Pull Request (Advanced) 🔧

If you're comfortable with Git and JSON:

1. **Fork the repository**

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Prompt-Hub.git
   cd Prompt-Hub
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b add-prompt-your-prompt-name
   ```

4. **Edit `public/data/prompts.json`**
   - Add your prompt following the schema (see below)
   - Maintain alphabetical/category order
   - Generate a unique ID (format: `category-###`)

5. **Validate your changes**
   ```bash
   npm install
   npm run validate:prompts
   ```

6. **Commit and push**
   ```bash
   git add public/data/prompts.json
   git commit -m "Add prompt: Your Prompt Title"
   git push origin add-prompt-your-prompt-name
   ```

7. **Open a Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Provide a clear description of your addition

### Prompt Schema

When adding prompts directly to JSON, follow this structure:

```json
{
  "id": "category-###",
  "title": "Short Descriptive Title",
  "category": "类别名称",
  "tags": ["tag1", "tag2", "tag3"],
  "prompt": "The actual prompt text with clear instructions...",
  "description": "Brief user-facing description in Chinese or English",
  "sourceLink": "https://optional-source-url.com",
  "createdAt": "2024-01-30T10:00:00Z",
  "updatedAt": "2024-02-15T14:30:00Z"
}
```

**Field Requirements:**
- `id`: Unique, format `{category-slug}-{number}` (e.g., `writing-042`)
- `title`: 3-8 words, clearly indicates purpose
- `category`: Must match predefined categories exactly
- `tags`: Array of 2-8 relevant tags
- `prompt`: Clear, specific, actionable instructions
- `description`: 1-3 sentences explaining use case
- `sourceLink`: (Optional) Valid URL
- `createdAt`: ISO 8601 datetime
- `updatedAt`: (Optional) ISO 8601 datetime

**Valid Categories:**
- AI绘画 (AI Drawing)
- 写作 (Writing)
- 编程 (Programming)
- 效率提升 (Productivity)
- 翻译 (Translation)
- 教育 (Education)
- 营销 (Marketing)
- 分析 (Analysis)

### Quality Guidelines

Before submitting a prompt, ensure it:

✅ **Is Well-Tested**
- Test with at least one AI model (ChatGPT, Claude, etc.)
- Produces consistent, high-quality results

✅ **Is Clear and Specific**
- Includes clear instructions
- Specifies expected output format
- Uses placeholders (e.g., [topic], [language]) for customizable parts

✅ **Provides Value**
- Solves a real problem or use case
- Is not a duplicate of existing prompts
- Offers something unique or improved

✅ **Is Appropriate**
- No harmful, offensive, or unethical content
- Respects copyright and attribution
- Follows community standards

❌ **Avoid:**
- Vague or ambiguous instructions
- Duplicate prompts (check existing collection first)
- Overly specific prompts with limited use cases
- Prompts that require proprietary data or paid services

---

## Code Contributions

### Getting Started

1. **Fork the repository**
   - Click "Fork" on the main repository page

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Prompt-Hub.git
   cd Prompt-Hub
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Making Changes

1. **Write code following project conventions**
   - Use TypeScript for type safety
   - Follow existing code style
   - Keep components small and focused
   - Use Vue 3 Composition API

2. **Test your changes**
   - Run the development server: `npm run dev`
   - Test all affected functionality
   - Validate data if modifying `prompts.json`: `npm run validate:prompts`

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request**
   - Navigate to your fork on GitHub
   - Click "New Pull Request"
   - Fill in the PR template with details

### Code Style

- **TypeScript**: Use strict type checking
- **Vue Components**: Use `<script setup lang="ts">` syntax
- **Naming**: 
  - Components: PascalCase (e.g., `PromptList.vue`)
  - Composables: camelCase with `use` prefix (e.g., `usePrompts.ts`)
  - Constants: UPPER_SNAKE_CASE (e.g., `CATEGORIES`)
- **Formatting**: Follow existing indentation and style
- **Comments**: Only for complex logic (code should be self-documenting)

---

## Maintainer Review Process

### How Issues Are Processed

When you submit a new prompt via GitHub Issues, here's what happens:

1. **Automatic Labeling** (Instant)
   - Issue is automatically labeled as `new-prompt` and `needs-review`

2. **Initial Review** (1-3 business days)
   - Maintainer reviews submission for completeness and quality
   - May ask for clarifications or suggest improvements via comments

3. **Quality Check** (1-2 business days)
   - Verify prompt is tested and produces good results
   - Check for duplicates in existing collection
   - Ensure proper categorization and tagging

4. **Decision** (within 5 business days total)
   - **Approved**: Maintainer adds prompt to `prompts.json`
   - **Changes Requested**: Issue remains open with feedback
   - **Declined**: Issue is closed with explanation

5. **Implementation** (when approved)
   - Maintainer creates a commit adding the prompt to JSON
   - Commit references the issue number (e.g., `Add prompt: Title (#123)`)
   - Issue is closed automatically or manually

6. **Deployment** (automatic)
   - Changes are merged to main branch
   - GitHub Actions deploys to GitHub Pages
   - New prompt appears on live site within minutes

### How Pull Requests Are Processed

1. **Automated Checks** (instant)
   - CI runs validation scripts
   - TypeScript compilation check
   - JSON schema validation (for prompt changes)

2. **Code Review** (2-5 business days)
   - Maintainer reviews code quality and functionality
   - Checks adherence to style guidelines
   - May request changes or improvements

3. **Testing** (1-2 business days)
   - Manual testing in development environment
   - Verify no regressions or breaking changes

4. **Merge** (when approved)
   - Maintainer merges PR into main branch
   - Automatic deployment to GitHub Pages

### Review Timeline Expectations

| Contribution Type | Initial Response | Final Decision |
|-------------------|------------------|----------------|
| Prompt submission (Issue) | 1-3 business days | 3-5 business days |
| Bug fix (PR) | 1-2 business days | 2-4 business days |
| Feature addition (PR) | 2-5 business days | 5-10 business days |
| Documentation (PR) | 1-2 business days | 1-3 business days |

*Note: Timelines are estimates. Complex contributions may take longer.*

### What Maintainers Look For

**For Prompt Submissions:**
- ✅ Complete and accurate information
- ✅ Clear, actionable prompt text
- ✅ Proper categorization and tagging
- ✅ Tested with AI models
- ✅ Unique value (not duplicate)
- ✅ Appropriate content

**For Code Contributions:**
- ✅ Solves a real problem or adds value
- ✅ Follows project conventions
- ✅ No breaking changes (unless discussed)
- ✅ Proper TypeScript types
- ✅ Clean, readable code
- ✅ Tested functionality

---

## Development Guidelines

### Project Structure

```
src/
├── components/      # Vue components
├── composables/     # Composition API utilities
├── constants/       # App-wide constants
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── App.vue         # Root component
└── main.ts         # Entry point
```

### Adding a New Component

1. Create file in `src/components/` with PascalCase name
2. Use `<script setup lang="ts">` syntax
3. Define proper TypeScript types for props and emits
4. Export component as default

Example:
```vue
<script setup lang="ts">
import { defineProps } from 'vue';
import type { Prompt } from '@/types/prompt';

const props = defineProps<{
  prompt: Prompt;
}>();
</script>

<template>
  <div class="prompt-card">
    <h3>{{ props.prompt.title }}</h3>
    <p>{{ props.prompt.description }}</p>
  </div>
</template>

<style scoped>
.prompt-card {
  /* component styles */
}
</style>
```

### Using the Prompts Data

```typescript
import { usePrompts } from '@/composables/usePrompts';
import { getPromptsByCategory, searchPrompts } from '@/types/prompt';

const { prompts, loading, error, fetchPrompts } = usePrompts();

// Load data
await fetchPrompts();

// Filter by category
const writingPrompts = getPromptsByCategory(prompts.value, '写作');

// Search
const results = searchPrompts(prompts.value, 'SEO');
```

### Validation

Always validate prompts data before committing:

```bash
npm run validate:prompts
```

This checks for:
- Valid JSON syntax
- Required fields present
- Unique IDs
- Valid categories
- Proper date formats
- Valid URLs

---

## Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting (no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(prompts): add SEO blog title generator prompt

Add a new prompt for generating SEO-optimized blog titles.
Closes #42
```

```
fix(ui): correct category filter dropdown behavior

The category filter was not properly resetting when cleared.
This commit fixes the reset logic in the filter component.
```

```
docs: update contribution guidelines

Add more detailed explanation of the maintainer review process
and expected timelines for different contribution types.
```

---

## Community Guidelines

### Code of Conduct

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Constructive**: Provide helpful feedback and suggestions
- **Be Patient**: Maintainers are volunteers; reviews take time
- **Be Open**: Welcome diverse perspectives and ideas
- **Be Collaborative**: Work together to improve the project

### Communication

- **Issues**: For bug reports, feature requests, and prompt submissions
- **Discussions**: For questions, ideas, and general conversation
- **Pull Requests**: For code changes and direct contributions

### Getting Help

If you need help:
1. Check existing documentation (README, this file, data schema docs)
2. Search existing issues for similar questions
3. Open a new issue with the `question` label
4. Be specific about what you're trying to accomplish

---

## Questions?

If you have questions about contributing that aren't covered here:
- Check the [README.md](README.md)
- Check the [Data Schema Documentation](public/data/README.md)
- Open a [GitHub Discussion](https://github.com/username/Prompt-Hub/discussions)
- Open an issue with the `question` label

---

## License

By contributing to Prompt Hub, you agree that your contributions will be licensed under the same [MIT License](LICENSE) that covers the project.

---

**Thank you for contributing to Prompt Hub!** 🎉

Your contributions help make high-quality AI prompts accessible to everyone.
