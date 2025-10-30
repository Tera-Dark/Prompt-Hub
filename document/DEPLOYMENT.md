# 部署指南（GitHub Pages）

本文档将帮助你将 Prompt-Hub 部署到 GitHub Pages，并提供常见问题的排查方案。

## 🚀 部署概览
Prompt-Hub 已内建 GitHub Actions 工作流，只需保持主干分支（`main`）代码稳定，推送后即可自动构建并发布到 GitHub Pages。

部署流程：
1. 提交或合并代码到 `main`
2. GitHub Actions 自动执行构建
3. 构建产物上传到 Pages
4. 几分钟后即可访问在线站点

## ✅ 首次部署前的准备
1. 打开仓库的 **Settings → Pages**
2. 在 **Source** 中选择 **GitHub Actions** 并保存
3. 前往 **Settings → Actions → General**
   - 在 **Workflow permissions** 选择 **Read and write permissions**
   - 勾选 **Allow GitHub Actions to create and approve pull requests**（若可用）
4. 确认仓库默认分支为 `main`
5. 首次推送 `main` 后，访问 **Actions** 标签页查看部署进度

## 🛠️ GitHub Actions 工作流说明
- 配置文件：`.github/workflows/deploy.yml`
- Node 版本：20
- 核心步骤：
  1. `actions/checkout` 拉取代码
  2. `actions/setup-node` 安装 Node，并开启 npm 缓存
  3. `npm ci` 安装依赖
  4. `npm run build` 生成 `dist`
  5. 上传构建产物并通过 `actions/deploy-pages@v4` 发布
- 无需额外配置即可适配 GitHub Pages 子路径 `/Prompt-Hub/`

## 🌐 自定义域名（可选）
1. 在仓库根目录创建或更新 `CNAME` 文件，写入自定义域名，例如：
   ```
   prompts.example.com
   ```
2. 在域名 DNS 服务商处添加 `CNAME` 记录指向 `tera-dark.github.io`
3. 稍待解析生效后，访问自定义域名确认是否成功
4. 若使用 HTTPS，请在 Pages 设置中检查证书状态

## 🔄 常见维护操作
- **手动触发部署**：在 **Actions → deploy** 工作流页面点击 **Run workflow**
- **查看上次部署的产物**：在 Pages 页面查看最新一次部署的 `Deployment` 记录
- **回滚到旧版本**：将旧的 commit 强制推送或通过 PR 合并，然后重新触发部署

## 🧯 部署故障排除
| 问题 | 诊断步骤 | 解决建议 |
| --- | --- | --- |
| Workflow 权限错误 | Actions 日志显示 `Resource not accessible by integration` | 检查 Actions 权限是否为 **Read and write** |
| 构建失败 | `npm run build` 报错 | 在本地运行构建命令，修复类型或语法错误后重新推送 |
| 无法访问页面 | 404 或空白页 | 确认仓库名称是否与 `vite.config.ts` 中的 `base` 路径一致 |
| 静态资源路径错误 | 浏览器控制台报错 404 | 确保部署路径中包含 `/Prompt-Hub/` 前缀 |
| 自定义域名未生效 | 访问旧域名仍跳转 | 检查 DNS 是否生效，确保 `CNAME` 文件存在于根目录 |

## 📚 参考资料
- [项目概览](./README.md)
- [开发指南](./DEVELOPMENT.md)
- [GitHub Pages 官方文档](https://docs.github.com/pages)

祝你部署顺利！🚀
