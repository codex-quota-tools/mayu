# 贡献指南

感谢参与 Codex Quota Tracker。

## 提交问题

- 先搜索已有 Issue。
- Bug 请包含操作系统、应用版本、复现步骤和预期/实际行为。
- 隐去截图和日志中的邮箱、额度详情、设备码、Token、Cookie 与本机路径。
- 安全漏洞请按 `SECURITY.md` 私下报告，不要公开提交。

## 开发流程

1. Fork 仓库并创建主题分支。
2. 只做与 Issue 相关的修改。
3. 运行：

   ```bash
   npm run build
   npm test
   cargo test --manifest-path src-tauri/Cargo.toml
   ```

4. 界面修改需同时检查浅色、深色和减少动态效果模式。
5. 提交 Pull Request，说明变更、测试结果和未验证的平台。

不要提交账户数据、登录文件、平台 sidecar、`node_modules`、`dist`、`src-tauri/target` 或安装包。
