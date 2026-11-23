# 本地调试

## 结论

本地调试**不使用 `link` / junction**。profile 里保持从 npm 正常安装的包，改代码后把构建产物同步进已安装目录。

这样做是因为在正式 profile 里留 junction 会导致：

- 从 npm 安装正式版时 pnpm 重命名覆盖 junction 失败，报 `EPERM`
- 插件元数据、版本号与实际加载内容不一致
- 清理时容易误删源码目录

## 标准流程

### 1. 改代码

```powershell
cd E:\myproject\dsh-plugin-daily-report
# 修改 src/client/** 或 lib/** 或 index.js
```

### 2. 构建

```powershell
npm run build
```

`client.js` 是生成产物，必须先构建再同步。

### 3. 同步到已安装的包

```powershell
npm run sync:plugin
```

脚本：`scripts/sync-to-profile.mjs`

默认目标：

```text
%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-plugin-daily-report
```

可覆盖：

```powershell
# 指定目录
node scripts/sync-to-profile.mjs "D:\some\path\dsh-plugin-daily-report"

# 或通过环境变量
$env:DSH_PROFILE_DIR = "C:\Users\me\.dsh\profiles\other"
npm run sync:plugin
```

### 4. 重新加载插件

在插件管理器里把 `dsh-plugin-daily-report` 禁用再启用，然后刷新页面。

Host 侧代码（`index.js`、`lib/**`）改动后，**禁用/启用插件不足以重新导入**：DSH 进程持有已加载的 ES 模块，必须重启 DSH 应用。纯前端（`client.js`）改动刷新页面即可。

## 同步范围

同步内容严格等于 `package.json` 的 `files` 白名单：

```text
index.js
client.js
cordis.patch.yml
lib/**/*.js
locale/*.json
client-locale/*.json
icon.svg
README.md
AGENTS.md
CHANGELOG.md
docs/**/*.md
```

`package.json` 本身不同步：已安装目录里的版本号必须保持 npm 包的真实版本，避免和注册表不一致。

## 为什么先删再复制

pnpm 用硬链接把包文件链接到全局 store。直接覆盖写入会穿透到 store，污染其他项目的依赖。脚本对每个文件先 `rm` 再 `copyFile`，让目标变成独立文件。

## 常见问题

### 同步后页面没变化

- 确认执行过 `npm run build`
- 刷新页面（`Ctrl + F5`）
- Host 代码改动（`index.js`、`lib/**`）必须重启 DSH 应用，禁用/启用插件不够

### 找不到已安装目录

先在插件管理器里从 npm 安装一次，或手动指定目录：

```powershell
node scripts/sync-to-profile.mjs "<目录>"
```

### 提示目标目录不是本插件

脚本会校验 `package.json` 的 `name`，防止同步到错误目录。检查传入路径。

### 想改成源码调试

不要用 junction。可以复制整个仓库到独立目录，或临时改 `client.js` 后立即同步回来，避免长期偏离。

## 同步到 GitHub

`git push` 到 github.com 在本机会被重置，GitHub 镜像改用 API：

```powershell
npm run mirror:github
```

详见 `docs/runbooks/mirror-to-github.md`。GitHub 上的提交号与本地不同属正常，内容一致。

## 发版仍然照常

同步只是本地验证手段，不会改变 profile 的依赖声明。正式发布走 `docs/runbooks/publish.md`，发布后在插件管理器里重新安装即可回到 npm 版本。



