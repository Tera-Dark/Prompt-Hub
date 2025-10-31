# 🔐 Prompt-Hub 管理员系统设计方案

## 📖 概述

Prompt-Hub 管理员系统是一个基于 GitHub OAuth 和 GitHub API 的**零成本、纯前端**解决方案，允许仓库管理员在线管理提示词内容。

## 🎯 设计目标

- ✅ 完全免费，无需额外服务
- ✅ 零服务器成本，纯静态部署
- ✅ 利用 GitHub 原生功能
- ✅ 数据自带版本控制
- ✅ 安全的权限管理

## 🏗️ 技术架构

### 核心技术栈
- **前端框架**: Vue 3 + TypeScript
- **身份验证**: GitHub OAuth App
- **数据存储**: GitHub Repository (prompts.json)
- **API 交互**: GitHub REST API
- **路由**: Vue Router
- **状态管理**: Pinia (可选)

### 架构图
```
┌─────────────┐
│   用户      │
└──────┬──────┘
       │ 访问管理后台
       ▼
┌─────────────────────────┐
│  GitHub OAuth 登录      │
│  (验证仓库权限)         │
└──────┬──────────────────┘
       │ 获取 Token
       ▼
┌─────────────────────────┐
│  管理后台界面           │
│  - CRUD 操作            │
│  - Issue 审核           │
│  - 数据统计             │
└──────┬──────────────────┘
       │ GitHub API
       ▼
┌─────────────────────────┐
│  GitHub Repository      │
│  - prompts.json         │
│  - Issues (用户提交)   │
└─────────────────────────┘
```

## 💡 方案对比

### 选择的方案：GitHub OAuth + API
| 优势 | 劣势 |
|------|------|
| ✅ 完全免费 | ⚠️ 需配置 OAuth App |
| ✅ 无需后端服务器 | ⚠️ 依赖 GitHub 服务 |
| ✅ 数据自带版本控制 | ⚠️ API 有速率限制 |
| ✅ 权限管理简单 | |
| ✅ 国内可访问 | |

### 放弃的方案
**Supabase**: 国内访问不稳定，增加复杂度  
**Cloudflare Workers**: 需要学习成本，非必需  
**自建服务器**: 需要成本，违背零成本原则

## 🔑 身份验证流程

### OAuth 认证流程
1. 用户点击"管理后台"按钮
2. 跳转到 GitHub OAuth 授权页面
3. 用户授权后返回携带 code
4. 前端使用 code 换取 access_token（通过 GitHub OAuth App）
5. 验证用户是否为仓库协作者
6. 保存 token 到 localStorage（加密）
7. 进入管理后台

#### Cloudflare Worker Token 交换代理
为确保 GitHub Client Secret 不会暴露在前端，我们使用一个体积极小的 Cloudflare Worker 作为中转：

```ts
export interface Env {
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  ALLOWED_ORIGIN?: string
}

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

function resolveAllowedOrigin(requestOrigin: string | null, allowed?: string) {
  if (!allowed) {
    return requestOrigin ?? '*'
  }

  const entries = allowed
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (requestOrigin && entries.includes(requestOrigin)) {
    return requestOrigin
  }

  return entries[0] ?? requestOrigin ?? '*'
}

function buildCorsHeaders(request: Request, allowed?: string) {
  const origin = request.headers.get('Origin')
  const resolved = resolveAllowedOrigin(origin, allowed)

  return {
    'Access-Control-Allow-Origin': resolved,
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

async function exchangeToken(code: string, env: Env) {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })

  const payload = await response.json()

  if (!response.ok || !payload.access_token) {
    return { error: payload.error_description || payload.error || 'token_exchange_failed' }
  }

  return {
    access_token: payload.access_token,
    scope: payload.scope ?? '',
    token_type: payload.token_type ?? 'bearer',
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = buildCorsHeaders(request, env.ALLOWED_ORIGIN)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }

    let body: { code?: string } | undefined

    try {
      body = await request.json()
    } catch (error) {
      return new Response(JSON.stringify({ error: 'invalid_json' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!body?.code) {
      return new Response(JSON.stringify({ error: 'missing_code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tokenPayload = await exchangeToken(body.code, env)

    const status = 'error' in tokenPayload ? 400 : 200

    return new Response(JSON.stringify(tokenPayload), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  },
}
```

> 🌐 具体的部署步骤与 Wrangler 配置请见《document/CF_WORKER_OAUTH.md》。

### 权限验证
```javascript
// 检查用户是否有仓库写权限
async function checkPermission(token, username) {
  const response = await fetch(
    `https://api.github.com/repos/Tera-Dark/Prompt-Hub/collaborators/${username}/permission`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  )

  if (response.status === 204) {
    return true
  }

  if (!response.ok) {
    return false
  }

  const payload = await response.json()
  return ['admin', 'maintain', 'write'].includes(payload.permission)
}
```

## 📋 功能模块设计

### 1. 身份验证模块
**路由**: `/admin/login`

**功能**:
- GitHub OAuth 登录按钮
- 自动验证仓库权限
- Token 管理（存储、刷新、清除）
- 登出功能

**UI 组件**:
- `LoginPage.vue` - 登录页面
- `AuthCallback.vue` - OAuth 回调处理

### 2. 管理后台首页
**路由**: `/admin/dashboard`

**功能**:
- 快速统计（总提示词数、分类分布）
- 待审核 Issue 数量提示
- 快捷操作入口
- 最近更新记录

**UI 组件**:
- `AdminDashboard.vue` - 仪表盘
- `StatsCard.vue` - 统计卡片

### 3. 提示词管理模块
**路由**: `/admin/prompts`

**功能**:
- ✅ 列表展示（表格视图 + 卡片视图切换）
- ✅ 搜索（标题、内容、标签）
- ✅ 筛选（分类、标签）
- ✅ 排序（创建时间、更新时间）
- ✅ 分页
- ✅ 批量操作（删除、修改分类）

**操作**:
- ➕ 新建提示词
- ✏️ 编辑提示词
- 🗑️ 删除提示词
- 👁️ 预览效果

**UI 组件**:
- `PromptList.vue` - 提示词列表
- `PromptEditor.vue` - 编辑器（创建/编辑）
- `PromptPreview.vue` - 预览组件

### 4. Issue 审核模块
**路由**: `/admin/review`

**功能**:
- 显示所有带特定标签的 Issue（如 `new-prompt`）
- Issue 详情预览
- 一键批准（添加到 prompts.json + 关闭 Issue）
- 拒绝并回复（添加评论 + 关闭 Issue）
- 批量审核

**操作流程**:
```
1. 获取所有 open 的 Issue (label: new-prompt)
2. 解析 Issue 内容（根据模板字段）
3. 预览提示词效果
4. 审核决策：
   - 批准 → 添加到 prompts.json → 提交 → 关闭 Issue → 感谢评论
   - 拒绝 → 添加评论说明原因 → 关闭 Issue
```

**UI 组件**:
- `IssueReview.vue` - 审核页面
- `IssueCard.vue` - Issue 卡片
- `ReviewModal.vue` - 审核弹窗

### 5. 数据管理模块
**路由**: `/admin/data`

**功能**:
- 📊 数据统计可视化
- 📥 导入 JSON（覆盖/合并模式）
- 📤 导出 JSON（全部/筛选）
- ✅ 数据验证工具
- 🔄 Git 历史查看
- 🔙 回滚到历史版本

**UI 组件**:
- `DataManagement.vue` - 数据管理页
- `ImportExport.vue` - 导入导出组件
- `DataValidator.vue` - 验证工具

## 🔧 GitHub API 使用

### 需要的 API 端点

#### 1. 读取文件内容
```javascript
GET /repos/Tera-Dark/Prompt-Hub/contents/public/data/prompts.json
```

#### 2. 更新文件内容
```javascript
PUT /repos/Tera-Dark/Prompt-Hub/contents/public/data/prompts.json
Body: {
  message: "Update prompts data",
  content: base64(JSON.stringify(data)),
  sha: "文件当前的 SHA"
}
```

#### 3. 获取 Issues
```javascript
GET /repos/Tera-Dark/Prompt-Hub/issues?labels=new-prompt&state=open
```

#### 4. 关闭 Issue
```javascript
PATCH /repos/Tera-Dark/Prompt-Hub/issues/{issue_number}
Body: { state: "closed" }
```

#### 5. 添加评论
```javascript
POST /repos/Tera-Dark/Prompt-Hub/issues/{issue_number}/comments
Body: { body: "感谢提交！已添加到数据库。" }
```

#### 6. 验证权限
```javascript
GET /repos/Tera-Dark/Prompt-Hub/collaborators/{username}
```

### API 速率限制
- 未认证: 60 次/小时
- 已认证: 5000 次/小时
- 足够管理员使用

## 🎨 UI/UX 设计

### 设计原则
- 延续主站的黑白灰极简风格
- 功能区分明确
- 操作流程简洁
- 响应式设计

### 配色方案
```css
--admin-primary: #000000;
--admin-secondary: #666666;
--admin-background: #fafafa;
--admin-border: #e0e0e0;
--admin-success: #4caf50;
--admin-warning: #ff9800;
--admin-danger: #f44336;
```

### 布局结构
```
┌─────────────────────────────────────┐
│  Header (Logo + 用户信息 + 登出)    │
├──────────┬──────────────────────────┤
│          │                          │
│  侧边栏  │     主内容区             │
│          │                          │
│ - 仪表盘 │                          │
│ - 提示词 │                          │
│ - 审核   │                          │
│ - 数据   │                          │
│          │                          │
└──────────┴──────────────────────────┘
```

## 🔒 安全性考虑

### Token 管理
- 使用 `localStorage` 存储（短期 token）
- 敏感操作前二次验证
- 定期刷新 token
- 登出时清除所有本地数据

### 权限控制
- 路由守卫（未登录重定向）
- API 调用前验证 token 有效性
- 检查用户仓库权限
- 敏感操作需要管理员权限

### 数据验证
- 前端表单验证
- 提交前 JSON schema 验证
- 防止 XSS 注入
- 防止重复提交

## 📦 部署方案

### 方式 1: 集成到主站（推荐）
- 路由: `/admin/*`
- 构建: 同一个 Vite 项目
- 优势: 统一部署，共享组件

### 方式 2: 独立部署
- 仓库: 独立的 admin 分支
- 域名: admin.prompt-hub.com（需要域名）
- 优势: 代码隔离

**推荐使用方式 1**，代码在同一个项目中，管理更方便。

## 🛣️ 路由规划

```javascript
const routes = [
  // 公开路由
  { path: '/', component: Home },
  
  // 管理员路由（需要认证）
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', component: Dashboard },
      { path: 'prompts', component: PromptList },
      { path: 'prompts/new', component: PromptEditor },
      { path: 'prompts/:id/edit', component: PromptEditor },
      { path: 'review', component: IssueReview },
      { path: 'data', component: DataManagement },
    ]
  },
  
  // OAuth 回调
  { path: '/auth/callback', component: AuthCallback }
]
```

## 📝 数据操作流程

### 添加新提示词
```
1. 用户在管理后台点击"新建"
2. 填写表单（标题、分类、标签、内容等）
3. 预览效果
4. 点击"保存"
5. 前端生成新 ID
6. 通过 GitHub API 读取 prompts.json
7. 添加新数据到数组
8. 通过 GitHub API 更新文件
9. 提交信息: "Add new prompt: {title}"
10. 成功提示 + 跳转到列表
```

### 编辑提示词
```
1. 在列表点击"编辑"
2. 加载现有数据到表单
3. 修改内容
4. 预览效果
5. 点击"保存"
6. 读取 prompts.json
7. 找到对应 ID 的数据并更新
8. 更新文件
9. 提交信息: "Update prompt: {title}"
```

### 删除提示词
```
1. 点击"删除"按钮
2. 确认弹窗
3. 读取 prompts.json
4. 从数组中移除对应 ID 的数据
5. 更新文件
6. 提交信息: "Delete prompt: {title}"
```

### 审核 Issue
```
1. 获取标签为 "new-prompt" 的 Issue 列表
2. 解析 Issue 内容（根据模板）
3. 显示预览
4. 管理员选择"批准"或"拒绝"
5. 批准流程:
   - 添加到 prompts.json
   - 关闭 Issue
   - 添加感谢评论
6. 拒绝流程:
   - 添加拒绝原因评论
   - 关闭 Issue
```

## 🔮 未来扩展

### Phase 2 功能
- 📊 详细的数据分析（浏览量、复制次数）
- 🏷️ 标签管理系统
- 👥 多管理员协作
- 🔔 通知系统（新提交提醒）
- 🌐 i18n 国际化支持

### Phase 3 功能
- 🤖 AI 辅助审核（检测内容质量）
- 📈 用户行为分析
- 💬 评论系统
- ⭐ 点赞收藏功能

## 📚 开发参考

### GitHub OAuth App 创建
1. 访问 GitHub Settings > Developer settings > OAuth Apps
2. 创建新应用
3. 配置:
   - Homepage URL: `https://tera-dark.github.io/Prompt-Hub/`
   - Callback URL: `https://tera-dark.github.io/Prompt-Hub/auth/callback`
4. 获取 Client ID 和 Client Secret

### 相关文档
- [GitHub OAuth 文档](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [GitHub REST API](https://docs.github.com/en/rest)
- [Vue Router](https://router.vuejs.org/)
- [Pinia State Management](https://pinia.vuejs.org/)

## ⚠️ 注意事项

1. **Client Secret 保护**
   - 不要在前端代码中暴露
   - 考虑使用 GitHub Actions 或 Cloudflare Worker 作为中间层

2. **API 速率限制**
   - 合理使用缓存
   - 避免频繁请求

3. **数据冲突**
   - 更新前检查 SHA 是否变化
   - 处理并发编辑冲突

4. **用户体验**
   - 操作要有加载状态
   - 错误要有明确提示
   - 成功操作要有反馈

## 🎯 总结

这个方案的核心优势是**零成本、高可用、易维护**。通过充分利用 GitHub 的原生功能，我们无需额外的后端服务即可实现完整的管理功能。

所有数据变更都会留下 Git 历史记录，既保证了数据安全，也方便追溯和回滚。

---

**文档版本**: v1.0  
**最后更新**: 2025-10  
**维护者**: Prompt-Hub Team
