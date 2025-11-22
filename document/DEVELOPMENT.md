# 开发指南

本文档介绍 Prompt-Hub 的本地开发流程、调试方法与编码规范，帮助你高效参与项目迭代。

## 🧱 本地开发环境配置

- 推荐使用 **Node.js 18 LTS**（至少 18.17.0）
- 包管理工具使用 **npm**（仓库附带 `package-lock.json`）
- 建议安装 **VS Code** 并启用以下扩展：
  - Vue Language Features (Volar)
  - TypeScript Vue Plugin (Volar)
  - ESLint / Prettier（保持代码风格统一）

首次克隆仓库后执行：

```bash
npm install
```

## 🚗 开发服务器启动

```bash
# 启动本地开发环境（热更新）
npm run dev
```

默认访问地址为 `http://localhost:5173/Prompt-Hub/`。若需要修改端口，可在 `vite.config.ts` 中配置 `server.port`。

## 📦 构建与预览

```bash
# 生成生产构建
npm run build

# 本地预览生产构建
npm run preview
```

构建完成后产物位于 `dist/` 目录。预览命令将启动一个本地服务，便于检查部署效果。

## 🧪 数据与类型校验

- 运行 `npm run validate:prompts` 校验 `prompts.json` 结构是否符合规范
- 数据类型定义位于 `src/types/prompt.ts`
- 分类常量维护在 `src/constants/categories.ts`
- 补充或修改数据后，请同步更新 [数据结构文档](./DATA_SCHEMA.md)

## 🧭 项目结构约定

```
src/
├── components/   # 业务组件（保持粒度清晰）
├── composables/  # 组合式 API，封装通用逻辑
├── constants/    # 枚举、常量、配置项
├── types/        # TypeScript 类型定义
├── utils/        # 与 UI 无关的工具函数
└── assets/       # 静态资源（若有）
```

新增模块时请遵循现有目录划分，避免混用职责。

## 🧩 添加新功能的流程建议

1. 在 Issue 中讨论需求与方案
2. 创建功能分支，例如 `feature/prompt-filter`
3. 在 `src/components` 内按功能拆分组件，尽量保持无状态组件的纯净性
4. 必要时在 `src/composables` 中编写可复用逻辑
5. 完成功能后更新相关文档（README、数据结构或贡献指南）
6. 提交 PR，等待代码审查

## 🎨 Vue 组件开发规范

- 统一使用 `<script setup lang="ts">`，并开启严格的 TypeScript 校验
- 组件 props 使用显式类型定义，默认值与校验逻辑清晰可见
- 样式使用 CSS Modules 或原子化工具类，避免全局样式污染
- 将复杂逻辑拆分为 composable 函数，引入响应式引用时使用 `ref`/`computed`
- 组件命名遵循 PascalCase，例如 `PromptCard.vue`

## 🔐 GitHub App OAuth 设置

为了支持 GitHub OAuth 认证，项目使用 Cloudflare Workers 作为 OAuth 代理。详细的设置和部署说明，请参考 [Cloudflare Worker GitHub App OAuth 文档](./CF_WORKER_GH_APP_OAUTH.md)。

**快速步骤：**

1. 在 `cf-worker` 目录中执行 `npm install`
2. 使用 `wrangler secret put` 配置 GitHub App 凭证
3. 执行 `npm run deploy` 部署 Worker
4. 更新 `.env` 中的 `VITE_GH_APP_OAUTH_PROXY_URL`

## 🧯 调试与常见问题

| 问题           | 可能原因                     | 解决方案                                                                       |
| -------------- | ---------------------------- | ------------------------------------------------------------------------------ |
| 页面空白或 404 | `base` 路径配置错误          | 检查 `vite.config.ts` 中 `base: '/Prompt-Hub/'`                                |
| 数据加载失败   | `prompts.json` 结构不合法    | 运行 `npm run validate:prompts` 并修复提示                                     |
| 类型报错       | 类型定义未更新或导入路径错误 | 对照 `@/types/prompt.ts` 修正类型声明                                          |
| 样式冲突       | 全局样式污染                 | 将样式限制在组件作用域或使用 CSS Modules                                       |
| OAuth 认证失败 | Worker 未部署或凭证配置错误  | 参考 [CF_WORKER_GH_APP_OAUTH.md](./CF_WORKER_GH_APP_OAUTH.md) 中的故障排除部分 |

更多整体信息可在 [项目文档概览](./README.md) 中获取。祝开发顺利！🛠️
