# 使用说明

## 1. 启动与登录

启动后，应用默认驻留在 macOS 菜单栏或 Windows 系统托盘，不显示普通主窗口。首次无法读取 Codex 数据时，面板会提供登录入口并打开官方设备授权页面。

本项目不要求用户填写 OpenAI API Key。登录流程由随应用运行的 Codex CLI 管理，本项目不读取或保存登录 Token。

## 2. 打开面板

- macOS：点击菜单栏中的 `Codex 额度 xx%`。
- Windows：点击系统托盘图标；若未看到，请检查“隐藏的图标”。
- 再次点击入口或点击面板外部即可收起。

## 3. Codex 额度卡片

- 大号百分比表示周期最长的额度窗口剩余额度，并与菜单栏数字保持一致。
- 如果官方同时返回较短周期额度，卡片会显示一条紧凑的辅助状态和重置倒计时。
- “北京时间”显示该窗口的预计重置日期。
- 卡片右下角按钮执行立即刷新。
- 手动刷新超过 15 秒或连接失败时，卡片会给出明确提示，不会一直停留在加载状态。
- 绿色、橙色和红色用于区分剩余额度区间，不代表费用或账单状态。

应用每 60 分钟自动刷新。数据读取失败时会保留明确的连接状态，不会用手动数据冒充官方数据。

## 4. 个人资料与 Token 活动

个人资料区域显示 Codex App Server 实际返回的账户统计。自定义资料名称只保存在本机。若字段没有由官方接口返回，界面显示 `—`，不会推测或补造。

## 5. WorkBuddy 手动记录

WorkBuddy 模块可以记录当前剩余积分、可选的本期总积分和可选的重置时间。这些数据由用户手动输入，只保存在应用本地文件中。模块不登录 WorkBuddy、不抓取 Cookie，也不调用非公开接口。

## 6. 设置

- 状态栏名称：可改为任意短文字，留空时仅显示百分比。
- 个人资料名称：只影响本机显示。
- 外观：跟随系统、浅色或深色。
- 随系统启动：控制桌面应用开机启动。
- 系统通知：在额度或手动积分达到阈值时提醒。
- WorkBuddy 阈值：用英文逗号分隔，例如 `1000, 500, 100`。

## 7. 本地数据位置

- macOS：`~/Library/Application Support/CodexQuotaTracker/data.json`
- Windows：`%LOCALAPPDATA%\CodexQuotaTracker\data.json`

删除这个文件会清除 WorkBuddy 手动记录和应用设置，但不会删除 Codex CLI 的登录状态。

## 8. 常见问题

### 显示“尚未连接 Codex”

确认 Codex CLI 已安装或已随应用正确打包，并重新完成设备登录。源码运行时可以执行：

```bash
npm install --no-save @openai/codex@0.146.0-alpha.9
npm run sidecar
node scripts/smoke-codex.mjs
```

### 网页预览可以打开，但没有托盘

`npm run dev` 只运行 React 网页。请使用 `npm run tauri dev` 测试桌面能力。

### macOS 或 Windows 阻止安装

未签名构建可能触发 Gatekeeper 或 SmartScreen。只使用 GitHub Release 中的文件并核对 SHA-256。正式分发应配置平台代码签名。
