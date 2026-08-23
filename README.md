# Codex Quota Tracker

> 一款本地优先、非官方的 macOS 菜单栏 / Windows 系统托盘应用，用于查看 Codex 额度与北京时间重置日期。

![License](https://img.shields.io/badge/license-MIT-111827.svg)
![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB.svg)
![Platforms](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-111827.svg)

Codex Quota Tracker 通过本机运行的 Codex CLI App Server 读取账户额度和使用统计。应用数据保存在本机，不需要项目 API Key，也没有自建云端服务。

本项目与 OpenAI 没有隶属、赞助或官方背书关系。“Codex”和“OpenAI”是其各自权利人的商标。

## 功能

- 在 macOS 菜单栏或 Windows 系统托盘显示 Codex 剩余额度。
- 显示额度重置日期，并明确转换为北京时间。
- 展示 Codex App Server 返回的账户统计与最近 12 周 Token 活动。
- 支持浅色、深色和跟随系统主题。
- 支持开机启动、低额度通知、自定义状态栏文字。
- 可选手动记录 WorkBuddy 积分；不会访问 WorkBuddy 的非公开接口。
- 每 60 分钟自动刷新，也可从额度卡片立即刷新。

## 隐私设计

| 数据 | 来源 | 保存位置 | 是否上传到本项目服务器 |
| --- | --- | --- | --- |
| Codex 额度与账户统计 | 本机 Codex CLI App Server | 运行时内存 | 否；项目没有服务器 |
| Codex 登录凭据 | 官方 Codex CLI 管理 | Codex 自己的本机目录 | 本项目不读取或保存 |
| WorkBuddy 积分 | 用户手动输入 | 应用本地 `data.json` | 否 |
| 主题、通知与显示名称 | 用户设置 | 应用本地 `data.json` | 否 |

源码和 GitHub Actions 不需要个人 API Key，也不应配置个人访问令牌、Codex 登录文件或浏览器 Cookie。

完整说明见 [隐私说明](docs/PRIVACY.md) 和 [安全策略](SECURITY.md)。

## 安装

### 从 Release 安装

在仓库的 [Releases](../../releases) 页面下载对应平台文件：

- macOS Apple Silicon：`.dmg` 或 `.app.zip`
- Windows x64：NSIS `.exe`

当前构建未签名时，macOS Gatekeeper 或 Windows SmartScreen 可能提示未知开发者。请核对 Release 中提供的 SHA-256，并只从本仓库下载。

### 从源码运行

环境要求：Node.js 22、Rust stable，以及对应平台的原生构建工具。

```bash
git clone <your-fork-or-repository-url>
cd codex-quota-tracker
npm ci
npm install --no-save @openai/codex@0.146.0-alpha.9
npm run sidecar
npm test
cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri dev
```

如果本机已安装可用的 Codex CLI，可跳过临时 NPM 安装；`npm run sidecar` 会尝试发现本机二进制。详细步骤见 [使用说明](docs/USAGE.md) 和 [开发指南](docs/DEVELOPMENT.md)。

## 基本使用

1. 启动应用。
2. 首次使用时按界面提示完成 Codex 设备登录；已有本机 Codex 登录时通常可直接读取。
3. 点击菜单栏或系统托盘中的 `Codex 额度 xx%` 打开面板。
4. 在额度卡片查看剩余百分比、北京时间重置日期和同步状态。
5. 展开“设置”可修改显示文字、主题、通知和开机启动。
6. WorkBuddy 区域仅用于手动记录，不代表实时官方数据。

## 开发命令

```bash
npm run dev        # 仅运行网页预览
npm run build      # TypeScript 检查并构建前端
npm test           # 前端单元测试
npm run sidecar    # 准备当前平台 Codex CLI sidecar
npm run tauri dev  # 运行完整桌面应用
```

Windows 可使用：

```powershell
.\scripts\build-windows.ps1
```

## 项目结构

```text
src/                         React 界面与格式化逻辑
src-tauri/src/               Rust 桌面运行时与 Codex App Server 通信
scripts/                     sidecar 准备、冒烟测试和 Windows 构建脚本
docs/                        使用、隐私与开发文档
.github/workflows/           CI 与跨平台安装包构建
assets/icon.svg              原创应用图标源文件
```

## 已知限制

- 当前只配置 Apple Silicon macOS 与 x64 Windows 构建。
- WorkBuddy 没有公开稳定接口，因此仅支持本地手动记录。
- Codex App Server 属于随 Codex CLI 演进的接口，升级 CLI 时需要重新验证消息结构。
- 未配置 Apple/Windows 代码签名时，安装包不适合无提示的大规模分发。

## 参与贡献

提交 Issue 或 Pull Request 前请阅读 [贡献指南](CONTRIBUTING.md) 和 [行为准则](CODE_OF_CONDUCT.md)。安全问题请不要公开提交 Issue，处理方式见 [SECURITY.md](SECURITY.md)。

## 许可证与第三方组件

项目代码采用 [MIT License](LICENSE)。随构建使用的 OpenAI Codex CLI 采用 Apache-2.0；界面参考来源及完整第三方声明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
