# 数据结构说明（prompts.json）

`prompts.json` 是 Prompt-Hub 的核心数据文件，保存所有提示词条目。本文档将介绍数据结构、字段规范与维护流程。

## 📁 文件位置

```
public/data/prompts.json
```

该文件会在运行时通过 `fetch` 方式加载，因此需要保持结构稳定。

## 🧬 顶层结构

```json
{
  "version": "1.0.0",
  "prompts": [ ... ]
}
```

- `version`：字符串格式的语义化版本，便于跟踪数据变更
- `prompts`：提示词对象数组

## 🧱 提示词对象字段

```typescript
interface Prompt {
  id: string // 唯一 ID（如 writing-001）
  title: string // 提示词标题
  category: string // 分类名称（见下表）
  tags: string[] // 标签列表
  prompt: string // 可复制的提示词正文
  description: string // 使用说明
  sourceLink?: string // 可选：参考链接
  createdAt: string // 创建时间（ISO 8601）
  updatedAt?: string // 可选：最近更新时间（ISO 8601）
}
```

### 字段要求

- **id**：格式为 `{分类slug}-{三位数字}`，数字需补零（001、002...）。全局唯一。
- **title**：简短有力，建议 3-8 个词，突出场景。
- **category**：必须匹配预设分类（见下文）。
- **tags**：2-8 个关键词，可中英混合，建议使用小写英文或规范中文。
- **prompt**：最终复制到 AI 工具中的文本，可包含占位符（如 `[主题]`）。
- **description**：简洁说明提示词适用场景与效果，建议 1-3 句。
- **sourceLink**（可选）：若引用外部资源，请提供完整 URL。
- **createdAt / updatedAt**：使用 ISO 8601 时间格式，例如 `2024-01-30T10:00:00Z`。

## 🗂️ 预设分类

| 分类英文 slug | 中文名称 | 图标 | 说明                     |
| ------------- | -------- | ---- | ------------------------ |
| ai-drawing    | AI绘画   | 🎨   | 生成或优化 AI 绘画提示词 |
| writing       | 写作     | ✍️   | 文案创作、润色与内容生成 |
| programming   | 编程     | 💻   | 代码生成、调试与优化     |
| productivity  | 效率提升 | ⚡   | 流程自动化、效率工具     |
| translation   | 翻译     | 🌐   | 语言翻译与本地化         |
| education     | 教育     | 📚   | 教学设计与学习辅导       |
| marketing     | 营销     | 📢   | 市场、品牌与传播策略     |
| analysis      | 分析     | 📊   | 数据分析、研究与洞察     |

新增分类需同步更新：

- `public/data/prompts.json`
- `src/constants/categories.ts`
- 文档：[贡献指南](./CONTRIBUTING.md)

## 🧾 示例条目

```json
{
  "id": "writing-015",
  "title": "专业邮件润色助手",
  "category": "写作",
  "tags": ["email", "business", "tone"],
  "prompt": "请将以下中文商务邮件润色得更加专业、简洁，并保留原意：\n\n[邮件正文]",
  "description": "适用于优化中文商务邮件，保持礼貌与重点明确。",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

## 🔍 数据维护流程

1. **新增提示词**：确保 ID 唯一、分类正确、标签完整。
2. **排序规则**：按分类分组后，依 ID 递增排列。
3. **版本号**：数据结构或字段变更时更新 `version`。
4. **校验脚本**：提交前运行 `npm run validate:prompts`，自动检测字段缺失或格式错误。
5. **重复检查**：避免提交主题相同或功能重叠的条目。

## 🧪 验证清单

- JSON 语法正确，可通过在线工具或 IDE 校验
- 所有必填字段齐全且格式符合要求
- ID、分类、标签等字符串无多余空格或大小写错误
- 日期使用 UTC 时间（`Z`）或明确的时区
- `sourceLink`（如存在）可正常访问

## 🆘 常见问题

| 情况                              | 解决方式                                                  |
| --------------------------------- | --------------------------------------------------------- |
| 构建报错 `Failed to load prompts` | 检查 `prompts.json` 是否存在语法错误或缺少必填字段        |
| 新增分类后页面未显示              | 确认是否同步更新 `src/constants/categories.ts` 与 UI 组件 |
| 标签检索不生效                    | 检查标签大小写与前后空格，保持统一格式                    |

更多背景信息请参阅 [项目文档概览](./README.md) 与 [贡献指南](./CONTRIBUTING.md)。
