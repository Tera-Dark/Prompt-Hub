# Prompt-Hub 文档中心

> 将最实用的提示词资源，以最简单的方式呈现给每一位创作者。

## 🌟 项目介绍与特性
Prompt-Hub 是一个专注于分享与管理优质 AI 提示词的开源平台，采用极简黑白灰视觉设计，帮助用户专注于内容本身。平台围绕“搜索、浏览、复制”三个核心操作构建，力求在桌面端与移动端都提供一致、流畅的体验。

**核心特性一览：**
- 🎯 极简黑白灰配色，聚焦信息层级
- 🔍 支持分类、标签与关键字多维检索
- 📋 一键复制提示词，提升使用效率
- 📱 完整的移动端适配与响应式布局
- 🧠 提供数据验证脚本，保证提示词结构一致性

## 🛠️ 技术栈说明
Prompt-Hub 基于现代前端技术栈构建：
- **框架**：Vue 3（组合式 API）
- **构建工具**：Vite
- **语言**：TypeScript + Vue SFC
- **样式**：CSS Modules + Tailwind 风格工具类（按需）
- **部署**：GitHub Pages（通过 GitHub Actions 自动化部署）
- **数据管理**：静态 `prompts.json`，配合类型定义与校验脚本

## 🧪 本地开发环境搭建
开始本地开发前，请确保已经安装以下工具：
- Node.js ≥ 18
- npm ≥ 9

开发流程：
```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（默认端口 5173）
npm run dev

# 3. 构建生产环境产物
npm run build

# 4. 预览生产环境（可选）
npm run preview

# 5. 校验提示词数据结构
npm run validate:prompts
```
启动后访问 `http://localhost:5173/Prompt-Hub/`，即可预览本地环境。若需要修改端口或代理规则，可参考 `vite.config.ts` 进行调整。

## 🗂️ 项目结构说明
```text
Prompt-Hub/
├── document/                 # 📚 文档中心
│   ├── README.md             # 完整项目概览（本文档）
│   ├── CONTRIBUTING.md       # 贡献指南
│   ├── DEPLOYMENT.md         # GitHub Pages 部署指南
│   ├── DEVELOPMENT.md        # 本地开发与代码规范
│   └── DATA_SCHEMA.md        # 数据结构与字段说明
├── public/
│   └── data/
│       └── prompts.json      # 核心提示词数据源
├── src/
│   ├── components/           # Vue 组件
│   ├── composables/          # 组合式 API 封装
│   ├── constants/            # 常量与枚举
│   ├── types/                # TypeScript 类型定义
│   ├── utils/                # 工具函数
│   ├── App.vue               # 根组件
│   └── main.ts               # 入口文件
├── package.json
├── vite.config.ts
└── README.md                 # 根目录简要说明
```
如需深入了解开发流程、部署步骤或数据结构，请参阅上述 `document` 文件夹内的其他文档。

## 📘 功能使用说明
1. **浏览分类**：在首页按照分类或标签浏览提示词，点击即可查看详情。
2. **关键字搜索**：使用搜索栏输入中文或英文关键字，实时筛选相关提示词。
3. **标签筛选**：在提示词详情中查看标签，点击可跳转到对应标签集合。
4. **一键复制**：点击复制按钮，可立即将提示词内容复制到剪贴板。
5. **移动端体验**：在手机端同样支持搜索、筛选与复制，无需额外设置。
6. **数据更新**：仓库维护者可通过 GitHub Issue 或 Pull Request 添加新的提示词，系统会在部署时自动校验数据结构。

## ❓ FAQ 常见问题
**Q1：如何为项目贡献新的提示词？**
参考 [贡献指南](./CONTRIBUTING.md) 中的 Issue 模板与数据格式要求，提交后会由维护者进行审核。

**Q2：为什么本地访问地址包含 `/Prompt-Hub/` 路径？**
项目部署在 GitHub Pages，默认使用仓库名作为子路径。可在 `vite.config.ts` 中通过 `base` 配置修改。

**Q3：提示词数据如何验证？**
执行 `npm run validate:prompts`，脚本会检查 JSON 结构、必填字段与格式规范。

**Q4：能否绑定自定义域名？**
可以，详见 [部署指南](./DEPLOYMENT.md) 中的自定义域名配置章节。

**Q5：遇到构建或类型错误怎么办？**
请按照 [开发指南](./DEVELOPMENT.md) 中的排查步骤，检查依赖版本、类型定义与 Vite 配置。

祝使用愉快！🎉
