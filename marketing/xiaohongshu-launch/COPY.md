# 码余｜小红书首发文案

## 推荐标题

我把 Codex 额度放进了菜单栏

## 备选标题

- 写到一半才发现 Codex 快没额度？
- 终于不用自己算 Codex 重置时间了
- 做了个随时看 Codex 额度的小工具

## 正文

最近 Codex 用得有点狠。

真正让我难受的不是额度少，而是任务做到一半，才发现周额度已经快见底了。每次还要打开页面看剩余多少，再把重置日期换算成北京时间。

所以我做了一个桌面小工具，叫「码余」。

装好以后，菜单栏或系统托盘会直接显示剩余百分比。点一下还能看到北京时间的重置日期、套餐信息和最近的 Token 活动。应用每 60 分钟自动刷新，也可以随时手动同步。

我比较在意账号安全，所以它直接读取本机 Codex CLI App Server：

- 不需要项目 API Key
- 没有中转服务器
- 不读取 Codex 登录凭据
- 设置和手动记录的数据只保存在本机

WorkBuddy 暂时没有稳定的公开余额接口，所以这里没有抓 Cookie，而是保留了一个手动记录积分的位置。

目前支持 Apple Silicon Mac 和 Windows x64，也有浅色、深色模式。代码、构建流程和安装包都已经放到 GitHub，免费开源。

GitHub 搜索：`codex-quota-tools/mayu`

这是第一版。如果你也经常用 Codex，欢迎试试；遇到问题可以直接在 GitHub 提 Issue。

## 话题标签

#Codex #开源软件 #Mac软件 #Windows软件 #效率工具 #程序员工具 #独立开发 #GitHub

## 建议置顶评论

下载方法：在 GitHub 搜索 `codex-quota-tools/mayu`，进入 Releases。Mac 下载 `.dmg`，Windows 下载 `Windows_x64-setup.exe`。

当前安装包还没有购买 Apple / Windows 商业签名证书，第一次打开可能出现系统安全提醒。请只从项目 GitHub 下载，并核对 Release 里的 SHA-256。

## 发图顺序

1. `01-cover.png`：先讲痛点和产品名字。
2. `02-quota.png`：说明状态栏能直接看剩余额度。
3. `03-beijing-reset.png`：突出北京时间重置日期。
4. `04-local-privacy.png`：交代 API Key、凭据和本地数据边界。
5. `05-platform-theme.png`：说明 Mac、Windows 与明暗主题。
6. `06-open-source.png`：给出 GitHub 搜索路径和下载入口。

## 发布前检查

- 使用上面的顺序上传 6 张原图，不要再次压缩或加滤镜。
- 正文保留“非官方、免费开源、本地读取”的事实边界。
- 不写“官方合作”“绝对安全”或“永久免费”等无法证明的说法。
- 发布后把下载方法放在置顶评论，正文读起来会更自然。
