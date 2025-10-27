# Prompts Data Schema

This directory contains the prompt data for the Prompt Hub application.

## File Structure

- `prompts.json` - Main data file containing all prompt entries

## JSON Schema

### Root Structure

```json
{
  "version": "1.0.0",
  "prompts": [...]
}
```

- `version` (string, required): Semantic version of the data schema
- `prompts` (array, required): Array of prompt objects

### Prompt Object Schema

Each prompt object must contain the following fields:

```typescript
{
  id: string;              // Unique identifier (format: category-###)
  title: string;           // Display title for the prompt
  category: string;        // Category name (see Categories section)
  tags: string[];          // Array of relevant tags
  prompt: string;          // The actual prompt text
  description: string;     // User-facing description of what the prompt does
  sourceLink?: string;     // Optional: URL to source or reference
  createdAt: string;       // ISO 8601 datetime
  updatedAt?: string;      // Optional: ISO 8601 datetime of last update
}
```

### Field Requirements

#### `id` (required)
- Format: `{category-slug}-{number}`
- Must be unique across all prompts
- Examples: `ai-drawing-001`, `writing-042`, `programming-015`
- Use leading zeros for numbers (e.g., 001, 002, ..., 010, 011)

#### `title` (required)
- Short, descriptive title
- Recommended length: 3-8 words
- Should clearly indicate the prompt's purpose

#### `category` (required)
- Must match one of the predefined categories (see below)
- Use exact category names with proper Chinese characters

#### `tags` (required)
- Array of 2-8 relevant tags
- Tags help with filtering and search
- Use both English and Chinese tags as appropriate
- Keep tags consistent across similar prompts

#### `prompt` (required)
- The actual prompt text that users will use
- Can be in English or Chinese depending on the use case
- Should be clear, specific, and actionable
- Can include placeholders like [topic] or [language]

#### `description` (required)
- User-facing explanation of what the prompt does
- Recommended length: 1-3 sentences
- Should describe use cases and benefits

#### `sourceLink` (optional)
- Full URL to original source, tutorial, or reference
- Only include if applicable and the source is reliable

#### `createdAt` (required)
- ISO 8601 datetime format
- Example: `2024-01-15T10:30:00Z`

#### `updatedAt` (optional)
- ISO 8601 datetime format
- Only include if the prompt has been modified after creation

## Predefined Categories

The following categories are currently supported:

| Category | Chinese | Icon | Description |
|----------|---------|------|-------------|
| AI绘画 | AI绘画 | 🎨 | 生成和优化AI绘画提示词 |
| 写作 | 写作 | ✍️ | 创作、编辑和改进文本内容 |
| 编程 | 编程 | 💻 | 编程、调试和代码优化 |
| 效率提升 | 效率提升 | ⚡ | 提升工作效率和生产力 |
| 翻译 | 翻译 | 🌐 | 翻译和语言转换 |
| 教育 | 教育 | 📚 | 教学和学习辅助 |
| 营销 | 营销 | 📢 | 营销文案和策略 |
| 分析 | 分析 | 📊 | 数据分析和研究 |

To add a new category, update both `/public/data/prompts.json` and `/src/constants/categories.ts`.

## Contributing New Prompts

### Guidelines

1. **Keep entries sorted**: Sort prompts by category first, then by ID within each category
2. **Use consistent IDs**: Follow the `{category-slug}-{number}` pattern
3. **Write clear descriptions**: Help users understand when and how to use the prompt
4. **Add relevant tags**: Make prompts discoverable through search and filtering
5. **Test prompts**: Ensure prompts work well with AI models before submitting
6. **Avoid duplicates**: Check existing prompts to avoid redundancy

### Adding a New Prompt

1. Choose the appropriate category
2. Generate a unique ID following the naming convention
3. Fill in all required fields
4. Add 2-8 relevant tags
5. Insert the new prompt in the appropriate position (sorted by category and ID)
6. Update the `updatedAt` field of the root data structure if applicable

### Example Entry

```json
{
  "id": "writing-999",
  "title": "Blog Post Title Generator",
  "category": "写作",
  "tags": ["blog", "title", "SEO", "creative"],
  "prompt": "Generate 10 catchy, SEO-friendly blog post titles about [topic]. Each title should be under 60 characters, include relevant keywords, and appeal to the target audience. Make them engaging and click-worthy while accurately reflecting the content.",
  "description": "生成吸引人的博客文章标题，优化SEO并提高点击率。",
  "createdAt": "2024-01-30T10:00:00Z"
}
```

## Validation

Before submitting changes:

1. **JSON Validation**: Ensure the JSON is valid (no syntax errors)
2. **Schema Compliance**: All required fields are present
3. **Unique IDs**: No duplicate IDs exist
4. **Valid Categories**: All categories match predefined values
5. **Date Format**: All dates use ISO 8601 format
6. **URL Format**: All `sourceLink` values are valid URLs

You can use the TypeScript types in `/src/types/prompt.ts` to validate data structure.

## Version History

- `1.0.0` (2024-01-28): Initial schema with core fields and basic categories

## Questions?

For questions or suggestions about the data schema, please open an issue in the repository.
