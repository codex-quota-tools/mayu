# 开发指南

## 环境

- Node.js 22
- Rust stable
- macOS：Xcode Command Line Tools
- Windows：Visual Studio 2022 Build Tools、Windows SDK、WebView2 Runtime

## 初始化

```bash
npm ci
npm install --no-save @openai/codex@0.146.0-alpha.9
npm run sidecar
```

Windows x64 如果 NPM 可选依赖没有自动安装：

```powershell
npm install --no-save @openai/codex@0.146.0-alpha.9 "@openai/codex-win32-x64@npm:@openai/codex@0.146.0-alpha.9-win32-x64"
npm run sidecar
```

`src-tauri/binaries/` 中的平台二进制是构建产物，已被 `.gitignore` 排除，不得提交。

## 验证

```bash
npm run build
npm test
cargo test --manifest-path src-tauri/Cargo.toml
node scripts/smoke-codex.mjs
```

最后一项会读取当前电脑的真实 Codex 账户数据，只应在本机执行；不要把输出提交到 Issue、日志或仓库。

## 桌面调试

```bash
npm run tauri dev
```

仅验证前端布局时可以运行 `npm run dev`，但该模式不能测试托盘、开机启动、通知和 Rust 命令。

## 发布构建

macOS Apple Silicon：

```bash
npm run sidecar
npm run tauri -- build --target aarch64-apple-darwin --bundles app,dmg
```

Windows x64：

```powershell
.\scripts\build-windows.ps1
```

也可以手动触发 `.github/workflows/build.yml`。正式 Release 应提供 SHA-256，并在大规模分发前配置代码签名。

## 跨电脑源码包

在已提交并通过测试的版本上运行：

```bash
npm run package:source
```

压缩包和对应的 SHA-256 会生成在 `release/`。源码包基于 Git 归档，只包含已跟踪文件，不包含 `.git/`、依赖、编译缓存、sidecar、安装包、本机设置或登录数据。解压后先阅读 `docs/CODEX_HANDOFF.md`。

## 版本升级

发布前同步修改 `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`、App Server 初始化消息中的版本和 `CHANGELOG.md`。升级 `@openai/codex` 后必须重新运行 sidecar 准备、冒烟测试和两个平台的安装包构建。
