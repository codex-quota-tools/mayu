# 隐私说明

Codex Quota Tracker 采用本地优先设计，不运行自建后端，也不要求项目 API Key。

## 应用会处理的数据

- Codex 额度、重置时间、套餐类型、账户邮箱及使用统计：由本机 Codex CLI App Server 返回，只用于界面展示。
- WorkBuddy 积分、提醒阈值、主题和自定义名称：由用户输入并保存在本机 `data.json`。

## 应用不会做的事

- 不把 Codex 额度、邮箱、Token 活动或 WorkBuddy 积分上传到项目维护者的服务器。
- 不在源码、配置或日志中保存 OpenAI API Key、Cookie、访问令牌或密码。
- 不访问 WorkBuddy 非公开接口，不自动读取 WorkBuddy 登录信息。
- 不使用遥测、广告 SDK 或第三方分析服务。

## Codex 登录

Codex 的身份验证由官方 Codex CLI 管理。该 CLI 可能按照其自身条款与 OpenAI 服务通信；这部分不由本项目实现。请阅读 OpenAI 适用的隐私政策和服务条款。

## GitHub Actions

安装包通过 GitHub Actions 构建，并由官方 `actions/upload-artifact` 上传本次运行的构建产物。项目工作流不需要个人 OpenAI Key、个人访问令牌、Codex 登录文件或浏览器 Cookie。

## 本地数据删除

- macOS：`~/Library/Application Support/CodexQuotaTracker/data.json`
- Windows：`%LOCALAPPDATA%\CodexQuotaTracker\data.json`

关闭应用后删除对应文件即可清除本应用保存的数据。这不会删除 Codex CLI 自己管理的登录数据。
