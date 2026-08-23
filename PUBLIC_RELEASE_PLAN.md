# 公开发布计划

## 原则

不要把原私人仓库直接改成 Public。旧提交中出现过个人姓名、本机邮箱、个性化默认值和私人仓库账号链接；删除当前文件不能删除 Git 历史。

## 推荐发布路径

1. 使用本目录作为全新公开源码基线，不复制原仓库 `.git`。
2. 再次运行敏感信息扫描，确认源码、文档、图片元数据和构建产物不含个人信息。
3. 如果不希望公开个人 GitHub 用户名，先创建一个中性 GitHub Organization 或独立维护账号。公开仓库的 Owner 无法隐藏。
4. 在中性 Owner 下创建全新空仓库 `codex-quota-tracker`，不要导入旧仓库历史。
5. 使用中性提交身份创建首次提交，例如 `Codex Quota Tracker contributors <contributors@users.noreply.github.com>`。
6. 先保持新仓库 Private，推送后运行 GitHub Secret Scanning、CI 和两平台构建。
7. 检查 Actions 日志和 Artifacts，确保没有账户邮箱、额度数据、本机路径或登录输出。
8. 配置分支保护、Dependabot、Issue 模板和 Security Policy。
9. 将仓库改为 Public，再创建签名标签与 GitHub Release。
10. Release 只上传安装包和 SHA-256；不要上传 `data.json`、`auth.json`、`.codex`、日志或冒烟测试输出。

## 发布前隐私清单

- [ ] `rg` 搜索不到个人姓名、邮箱、手机号、QQ 号、私人用户名和绝对路径。
- [ ] Git 历史仅包含中性作者身份。
- [ ] `.gitignore` 覆盖 `.env*`、密钥、登录文件、本地数据、sidecar 与构建目录。
- [ ] GitHub Actions Secrets 中没有 OpenAI API Key、Codex Token 或 Cookie。
- [ ] 图片已移除 EXIF、作者和本机路径元数据。
- [ ] Release 安装包来自干净 CI 构建，不是个人 Application Support 目录的拷贝。
- [ ] README 明确“非官方、本地优先、无自建服务器”。
- [ ] `LICENSE`、`THIRD_PARTY_NOTICES.md`、`SECURITY.md` 完整。

## 仓库设置建议

- Topics：`tauri`, `react`, `rust`, `codex`, `menubar-app`, `system-tray`, `local-first`
- 默认分支：`main`
- 合并方式：Squash merge
- 分支保护：要求 CI 通过、阻止 force push
- 功能：Issues、Discussions、Dependabot security updates、Secret scanning
- 不建议：Wiki（文档已在仓库内）、直接上传个人本机构建目录
