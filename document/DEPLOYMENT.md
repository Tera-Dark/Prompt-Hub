# 📦 部署指南

## 重要说明

GitHub Pages 的部署分为两个阶段：

### 阶段 1：手动启用 Pages（必需，只需一次）
这个步骤**无法通过代码自动完成**，必须由仓库管理员手动操作。

### 阶段 2：自动化部署
完成阶段 1 后，每次推送到 main 分支都会自动部署。

---

## 📝 详细步骤

### Step 1: 启用 GitHub Pages

1. 打开你的仓库页面
2. 点击 **Settings** (设置) 标签
3. 在左侧菜单找到 **Pages**
4. 在 "Build and deployment" 部分：
   - **Source**: 下拉选择 `GitHub Actions`
5. 点击 **Save** 保存

**截图示例：**
```
┌─────────────────────────────────┐
│ Source                          │
│ ▼ GitHub Actions         [推荐] │
└─────────────────────────────────┘
```

### Step 2: 配置 Actions 权限（如果仍失败）

如果部署仍然失败，需要额外配置：

1. 进入 **Settings** > **Actions** > **General**
2. 滚动到 "Workflow permissions"
3. 选择：`Read and write permissions`
4. 勾选：`Allow GitHub Actions to create and approve pull requests`
5. 点击 **Save**

### Step 3: 触发首次部署

完成上述设置后：

**方式 1：推送代码**
```bash
git add .
git commit -m "Enable GitHub Pages"
git push origin main
```

**方式 2：手动触发**
1. 进入 **Actions** 标签
2. 选择 "Deploy to GitHub Pages" 工作流
3. 点击 "Run workflow"
4. 选择 main 分支
5. 点击绿色的 "Run workflow" 按钮

### Step 4: 验证部署

1. 在 **Actions** 标签页查看工作流状态
2. 等待绿色的 ✓ 标记（通常需要 1-2 分钟）
3. 访问你的网站：`https://你的用户名.github.io/Prompt-Hub/`

---

## ❌ 常见问题

### 问题 1: "Not Found" 404 错误
**原因**：未启用 GitHub Pages  
**解决**：按照 Step 1 手动启用

### 问题 2: "Resource not accessible by integration"
**原因**：Actions 权限不足  
**解决**：按照 Step 2 配置权限

### 问题 3: 部署成功但访问 404
**原因**：base 路径配置问题  
**检查**：`vite.config.ts` 中的 `base: '/Prompt-Hub/'`

### 问题 4: 样式丢失
**原因**：资源路径错误  
**解决**：确保 base 路径与仓库名一致

---

## 🔧 本地测试部署构建

在推送前，可以本地验证构建：

```bash
# 安装依赖
npm install

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

访问 `http://localhost:4173` 查看效果。

---

## 📌 注意事项

1. **仓库必须是 public**：GitHub Pages 免费版只支持公开仓库
2. **分支选择**：确保推送到 main 分支
3. **首次部署较慢**：第一次部署可能需要 5-10 分钟
4. **缓存问题**：如果看不到更新，尝试清除浏览器缓存

---

## 🆘 仍然无法部署？

请检查：
- [ ] 仓库是否为 public
- [ ] 是否已在 Settings > Pages 中选择 GitHub Actions
- [ ] Actions 权限是否设置为 Read and write
- [ ] 工作流文件路径是否正确：`.github/workflows/deploy.yml`
- [ ] `vite.config.ts` 的 base 是否为 `/Prompt-Hub/`

如果以上都确认无误，请查看 Actions 标签页的详细错误日志。
