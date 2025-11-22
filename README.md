# Prompt-Hub

> ⚠️ **首次部署必读**：如果你 fork 了此项目，必须先[手动启用 GitHub Pages](#-部署设置) 才能使用！

<div align="center">
  <p>🎨 极简黑白灰风格的提示词分享平台</p>
  <p>通过最简单的方式分享和使用优秀的 AI 提示词</p>
</div>

## 🚀 在线访问

[https://tera-dark.github.io/Prompt-Hub/](https://tera-dark.github.io/Prompt-Hub/)

## ⚙️ 部署设置

### ❗ 首次部署必须完成以下步骤

**这是强制性的！** GitHub Actions 无法自动启用 Pages，必须手动操作：

1. **进入仓库设置**  
   访问：`https://github.com/你的用户名/Prompt-Hub/settings/pages`

2. **启用 GitHub Pages**
   - 在 "Build and deployment" 部分
   - **Source** 选择：`GitHub Actions`
   - 点击 Save 保存

3. **设置 Actions 权限**（如果部署仍然失败）  
   访问：`Settings` > `Actions` > `General`
   - 在 "Workflow permissions" 选择 `Read and write permissions`
   - 勾选 `Allow GitHub Actions to create and approve pull requests`
   - 保存设置

4. **触发部署**  
   完成上述设置后，推送代码到 main 分支将自动部署

### 验证部署成功

- 查看 Actions 标签页，确认工作流运行成功
- 访问 `https://你的用户名.github.io/Prompt-Hub/`

详细文档请查看：[部署指南](./document/DEPLOYMENT.md)

## ✨ 特性

- 🎯 黑白灰极简设计
- 🔍 强大的搜索和分类功能
- 📋 一键复制提示词
- 📱 完美的移动端适配
- 🆓 完全免费，无需注册

## 📚 文档

- [完整文档](./document/README.md)
- [贡献指南](./document/CONTRIBUTING.md)
- [部署指南](./document/DEPLOYMENT.md)
- [开发指南](./document/DEVELOPMENT.md)
- [数据结构](./document/DATA_SCHEMA.md)

## 🤝 贡献

欢迎提交优秀的提示词！请查看 [贡献指南](./document/CONTRIBUTING.md)

## 📄 License

MIT License
