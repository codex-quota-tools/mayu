# 码余跨电脑开发交接

这份文档用于在另一台 Mac 或 Windows 电脑上继续开发「码余」。项目是 Tauri 2 + React/TypeScript + Rust 桌面应用，公开仓库为：

`https://github.com/codex-quota-tools/mayu`

## 当前状态

- 中文品牌名：码余
- 技术项目名：Codex Quota Tracker
- 当前版本：0.1.9
- 支持平台：macOS Apple Silicon、Windows x64
- 发布页：`https://github.com/codex-quota-tools/mayu/releases/latest`
- 桌面形态：macOS 菜单栏 / Windows 系统托盘
- Codex 数据来源：本机 Codex CLI App Server
- WorkBuddy：只支持本地手动记录积分，不读取 Cookie 或非公开余额接口
- 小红书首发素材：`marketing/xiaohongshu-launch/`

## 开发包没有包含什么

为了防止泄露账号信息并缩小体积，开发包不包含：

- `node_modules/`、`dist/`、Rust `target/` 等可重建内容
- `src-tauri/binaries/` 中的 Codex 原生 sidecar
- `.git/` 历史目录
- `data.json`、数据库、日志与本机设置
- `.env`、API Key、Token、Cookie、证书或 Codex 登录文件
- DMG、EXE、MSI、ZIP 等历史构建产物

Codex sidecar 必须在目标电脑上从本机 Codex 或官方 NPM 包重新准备。

## 新电脑恢复

先核对随压缩包提供的 `.sha256` 文件，再解压源码包。压缩包由已提交的 Git 文件生成，不包含开发电脑上的未提交内容。

安装以下环境：

- Node.js 22
- Rust stable
- macOS：Xcode Command Line Tools
- Windows：Visual Studio 2022 Build Tools、Windows SDK、WebView2 Runtime

进入解压后的 `mayu-source` 目录并运行：

```bash
npm ci
npm install --no-save @openai/codex@0.146.0-alpha.9
npm run sidecar
npm run build
npm test
cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri dev
```

Windows x64 如果没有自动安装平台包：

```powershell
npm install --no-save @openai/codex@0.146.0-alpha.9 "@openai/codex-win32-x64@npm:@openai/codex@0.146.0-alpha.9-win32-x64"
npm run sidecar
.\scripts\build-windows.ps1
```

macOS Apple Silicon 构建：

```bash
npm run sidecar
npm run tauri -- build --target aarch64-apple-darwin --bundles app,dmg
```

## 真实额度冒烟测试

```bash
node scripts/smoke-codex.mjs
```

这条命令会读取当前电脑登录的真实 Codex 账户额度。输出只能用于本机验证，不要粘贴到公开 Issue、CI 日志或 GitHub 仓库。只有脚本成功并同时返回 `remainingPercent` 与 `resetsAt` 时，才可以把结果用于通知或邮件。

## 关键目录

```text
src/                         React 界面与格式化逻辑
src-tauri/src/               Rust 桌面运行时与 App Server 通信
src-tauri/tauri.conf.json    窗口、图标、sidecar 与打包配置
scripts/                     Sidecar、冒烟测试与 Windows 构建脚本
docs/                        使用、隐私、开发和交接文档
.github/workflows/           CI 与跨平台安装包构建
assets/                      应用图标和 GitHub 海报
marketing/                   小红书推广图片与文案
```

## 必须保留的产品边界

- Codex 额度来自本机官方 App Server，读取失败时显示失败状态，不用手动数据冒充。
- WorkBuddy 积分明确标记为手动记录；没有公开稳定接口前不抓 Cookie、不提取本机 Token。
- 用户设置保存在本机，不增加自建云端账号或数据中转服务。
- 保留菜单栏 / 系统托盘、手动刷新、每 60 分钟刷新、数据更新时间和北京时间重置日期。
- 项目是非官方工具，不使用 OpenAI 官方结形标志，也不暗示官方合作。

## 继续开发时优先检查

1. 运行前端与 Rust 测试，确认干净环境可以恢复。
2. 运行 `npm run sidecar`，确认复制的是原生 Mach-O 或 PE 文件，而不是 NPM 启动脚本。
3. 运行真实额度冒烟测试，确认 App Server 消息结构没有变化。
4. 在 macOS 和 Windows 分别验证托盘点击、刷新、主题、通知和开机启动。
5. 发布前扫描凭据，验证安装包格式并生成 SHA-256。

## 可直接交给另一台电脑 Codex 的提示词

```text
请接手“码余”项目。先完整阅读 README.md、docs/DEVELOPMENT.md、docs/PRIVACY.md、docs/CODEX_HANDOFF.md 和 AGENTS.md（如果存在），然后检查 git 状态与当前平台环境。项目是 Tauri 2 + React/TypeScript + Rust 的本地优先 Codex 额度工具。不要提交或读取用户的 API Key、Token、Cookie、data.json、Codex 登录文件或 src-tauri/binaries 中的生成文件。先运行 npm ci、npm run build、npm test 和 cargo test；准备本机 Codex sidecar 后再运行 smoke-codex.mjs 与 tauri dev。任何真实额度测试失败都要明确报告，不要伪造数据。修改完成后验证桌面能力、隐私边界和跨平台构建，并更新中文文档。
```
