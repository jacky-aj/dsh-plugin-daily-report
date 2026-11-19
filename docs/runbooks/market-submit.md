# 提交到 awesome-dsh-plugin 插件市场

列表地址：<https://github.com/awesome-dsh-plugin/awesome-dsh-plugin>
规则原文：`contributing.md`

## 一句话结论

收录只需要**一个 YAML 文件**的 PR。但对本插件来说，**硬性前置条件是仓库必须在 GitHub 上**——`url` 字段必须是 `https://github.com/owner/repo`，CI 会直接去那个仓库读 `package.json`。当前项目托管在 Gitee，所以第一步不是写 YAML，而是先有 GitHub 仓库。

## 当前差距

| 要求 | 现状 | 处理 |
|---|---|---|
| `url` 是 GitHub 仓库 | ❌ 只有 Gitee | 建 GitHub 仓库并推送 |
| `package.json` 有 `dsh.bundle` | ✅ | 无需改动 |
| 有 `cordis.patch.yml` | ✅ | 无需改动 |
| 仓库有真实可用代码 | ✅ | 无需改动 |
| 仓库创建满 1 天 | ❌ GitHub 仓库新建即为 0 天 | 建好后等 1 天再提 PR（CI 自动检查） |
| 仓库有 `dsh-plugin` topic | ❌ | 在 GitHub 仓库设置里添加 |
| npm 包 `repository` 指回该仓库 | ❌ 指向 Gitee | 改 `package.json` 并发新版本 |
| 描述属实、无营销词 | 待写 | 见 `docs/market/entry.yml` |
| 图标为 GitHub 托管位图 | ⚠️ 仓库只有 `icon.svg` | 可省略（回退作者头像） |
| 截图 | 无 | 可选，后续用 `screenshots.json` 声明 |

## 当前状态（已核对 GitHub `jacky-aj/dsh-plugin-daily-report`）

```text
公开仓库        ✓ public
默认分支        master
创建时间        2026-11-16 06:06 UTC  → 已满 1 天
最新提交        a603e5d（= npm 1.1.2）
dsh.bundle      ✓ ./cordis.patch.yml
cordis.patch.yml ✓ 内容符合要求
真实代码        ✓
dsh-plugin topic ✓ 已设置
repository 字段  ⚠️ 仍指向 Gitee
```

也就是说：**硬性条件已全部满足**，可以直接提 PR。剩下的都是可选优化：修正 `repository` 字段（影响 npm 下载量关联，需发新版本），以及把本地领先的一个提交推上去（收录不要求）。

## 步骤

### 1. 建 GitHub 仓库并推送

建议保留 Gitee 为主仓，GitHub 作为镜像，两边都推：

```powershell
cd E:\myproject\dsh-plugin-daily-report
git remote add github https://github.com/jacky-aj/dsh-plugin-daily-report.git
git push github master
```

仓库必须 **public**。

### 2. 加 topic

GitHub 仓库页面 → About 右侧齿轮 → Topics 添加：

```text
dsh-plugin
```

### 3. 让 npm 包关联到 GitHub 仓库（可选但推荐）

市场会用 npm 的 `repository` 字段把包和仓库关联起来，否则不显示下载量。收录本身不受影响。

`package.json` 里把 `repository.url` 改成 GitHub 地址，`homepage` 可以继续留 Gitee：

```json
"repository": { "type": "git", "url": "https://github.com/jacky-aj/dsh-plugin-daily-report" }
```

改完需要发一个新版本才会体现在 registry 上，否则市场读到的还是旧字段。

### 4. 等满 1 天

CI 会检查目标仓库年龄。刚建好的仓库会被判为 0 天而失败；这不是拒绝，隔天重提即可。

### 5. 提 PR

Fork 列表仓库，添加一个文件：

```text
data/plugins/jacky-aj__dsh-plugin-daily-report.yml
```

内容用 `docs/market/entry.yml` 里那份。

**不要**改 `README.md` 或 `README.zh.md`——它们是脚本生成的，手改会导致 PR 冲突且被打回。一个 PR 最多 3 条条目，我们只加 1 条。

### 6. 等 CI 与评审

CI 依次检查：条目数量 → `dsh.bundle` → 仓库年龄 → `awesome-lint` 与站点构建。

通过后由维护者实际阅读仓库。反馈会以 PR 评论给出，明确指出要改什么；按提示改同一分支再推即可，不用重开 PR。

如果被打上 `held: author` 标签：不是拒绝，是等修改。推完修复后留**一条**评论说明改了什么，等重新评审。

## 容易被打回的点

- **只声明 `dsh.client`**：最常见的拒绝原因。我们已经同时声明了 `dsh.bundle`，没问题。
- **描述夸大**：描述会被逐句对照代码核对。不要写"支持所有格式"之类。
- **改了别人的条目**：只加自己那一个文件。
- **手改生成的 README**：绝对不要。
- **纯聚合包**：只装别人插件的包不收录。我们是独立实现，没问题。
- **仓库太新**：等满 1 天。

## 可选增强

### 图标

市场卡片图标约 96px，需要 **GitHub 托管的位图**（png/jpg/jpeg/webp），SVG 会被拒。想自定义就在仓库放：

```text
assets/icon-180.png
```

条目里加：

```yaml
icon: https://raw.githubusercontent.com/jacky-aj/dsh-plugin-daily-report/main/assets/icon-180.png
```

不写则回退到 GitHub 头像。

### 截图

在自己仓库 `package.json` 旁边放 `screenshots.json`：

```json
["assets/screenshot-1.png", "assets/screenshot-2.png"]
```

1–8 张，路径相对该文件，不能跳出插件目录。市场会优先使用，否则从 README 自动抽取。

## 待办清单

- [x] 建 GitHub public 仓库（jacky-aj/dsh-plugin-daily-report）
- [ ] 推送本地领先的一个提交（1102dd4）到 GitHub
- [x] 添加 `dsh-plugin` topic
- [ ] （可选）改 `package.json` 的 `repository` 为 GitHub，并发布新版本
- [x] 仓库已满 1 天
- [ ] Fork 列表仓库，添加 `data/plugins/jacky-aj__dsh-plugin-daily-report.yml`
- [ ] 开 PR，跟进 CI 与评审意见



