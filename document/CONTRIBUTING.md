# 贡献指南

感谢你对 Prompt-Hub 的关注！为了保持平台内容的高质量与一致性，请在贡献前阅读并遵循以下规范。

## 📨 如何提交新的提示词

1. 前往仓库的 [GitHub Issues](https://github.com/tera-dark/Prompt-Hub/issues)。
2. 选择“📮 Prompt 提交”模板，填写以下信息：
   - **提示词名称**：一句简洁的描述
   - **分类**：从现有分类中选择（详见 [数据结构文档](./DATA_SCHEMA.md)）
   - **标签**：2-8 个关键词，帮助检索
   - **提示词正文**：最终要复制使用的内容
   - **使用说明**：建议的场景、注意事项
3. 附上示例输入或输出（若有），方便审核。
4. Issue 提交后，维护者会在 3 个工作日内反馈并安排合并。

> 💬 如果是修复已有提示词或补充说明，同样可以通过 Issue 或 Pull Request 提交。

## 🧱 提示词格式要求

- 必须遵循 [prompts.json](../public/data/prompts.json) 中的字段定义。
- ID 命名规则：`{分类英文slug}-{三位数字}`，例如 `writing-012`。
- 描述应简洁清晰，突出使用场景与目标受众。
- 标签需使用小写英文或规范中文词汇，保持跨提示词的一致性。
- 提示词正文建议包含可替换的占位符（如 `[主题]`），并保证复制后即可直接使用。

## 🔄 Pull Request 提交规范

1. 从 `main` 分支创建功能分支，命名建议使用 `feature/`、`fix/` 前缀。
2. 在提交前执行：
   ```bash
   npm run validate:prompts
   npm run build
   ```
3. 保持 PR 精准聚焦单一问题，并在描述中说明：
   - 变更内容概述
   - 测试或验证方式
   - 关联的 Issue 编号
4. 至少等待一位维护者完成代码审查后再合并。

## 🧭 代码风格与最佳实践

- 使用 TypeScript，优先引用 `@/types/prompt` 提供的类型。
- Vue 组件推荐使用组合式 API (`<script setup>`) 与 `defineProps`/`defineEmits`。
- 样式遵循现有的黑白灰设计语言，避免引入复杂色彩。
- 工具函数放置于 `src/utils`，常量统一在 `src/constants` 维护。
- 新增的提示词或功能如需文档，请更新 `document/` 目录下的相关文件。

我们期待你的贡献，让 Prompt-Hub 变得更好！🤝
