# 常见问题

## 从 npm 安装插件时报 `EPERM: operation not permitted, rename`

### 现象

插件管理器中安装失败，提示「没有写入权限，无法安装」，日志末尾是：

```text
[ERR_PNPM_EPERM] [importPackage ...\node_modules\dsh-plugin-daily-report]
EPERM: operation not permitted, rename '...\dsh-plugin-daily-report_tmp_...' -> '...\dsh-plugin-daily-report'
```

或：

```text
[EPERM] EPERM: operation not permitted, rename '...\package.json.xxxx' -> '...\package.json'
```

### 原因

多数情况不是真的没有写入权限，而是 profile 里残留了旧的本地链接。

之前用 `include:` 方式把本地仓库链接进 profile 时，会生成一个目录 junction：

```text
C:\Users\yuanj\.dsh\profiles\desktop\node_modules\dsh-plugin-daily-report
  → E:\myproject\dsh-plugin-daily-report
```

从 npm 安装正式版本时，pnpm 需要在同一路径创建真实目录。Windows 上重命名覆盖一个已存在的 junction 会失败，于是报 EPERM。

第二种 EPERM（重命名 `package.json`）通常是 DSH 自身正在写入 profile，属于瞬时冲突，重试即可。

### 处理

1. 确认是可写路径、且目录属主正确：

   ```powershell
   Get-Acl "$env:USERPROFILE\.dsh\profiles\desktop"
   ```

2. 检查是否存在残留 junction：

   ```powershell
   $link = "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\dsh-plugin-daily-report"
   if (Test-Path $link) { (Get-Item $link -Force) | Select-Object LinkType, Target }
   ```

   如果 `LinkType` 是 `Junction` 或 `SymbolicLink`，且 `Target` 指向本地开发目录，就是它。

3. 只删除链接本身，不要删除目标目录：

   ```powershell
   [System.IO.Directory]::Delete($link, $false)
   ```

   **不要**用 `Remove-Item -Recurse`，那会删掉链接指向的源码。

4. 重新安装：

   ```powershell
   cd "$env:USERPROFILE\.dsh\profiles\desktop"
   node "D:\DeepSeek Harness\resources\runtime\primary-runtime\dependencies\pnpm\bin\pnpm.cjs" `
     add dsh-plugin-daily-report --registry=https://registry.npmjs.org/
   ```

   或在插件管理器里点「重试」。

5. 确认结果：

   ```powershell
   (Get-Content .\node_modules\dsh-plugin-daily-report\package.json -Raw | ConvertFrom-Json).version
   ```

### 验收

插件启用后：

```powershell
Invoke-RestMethod http://127.0.0.1:<port>/daily-report/state
Invoke-RestMethod http://127.0.0.1:<port>/daily-report/locales
```

应分别返回设置和页面词典。

## 插件元数据报 `must use a language id as its filename`

### 原因

DSH 会扫描包内 `locale/` 目录，并要求文件名必须是语言 ID，例如 `zh.json`、`en.json`。

`locale/page.zh.json`、`locale/page.en.json` 不符合这个规则。

### 处理

页面词典不要放在 `locale/`。本项目使用独立目录：

```text
locale/zh.json            插件元数据
locale/en.json            插件元数据
client-locale/page.zh.json 页面词典
client-locale/page.en.json 页面词典
```

同时确认 `package.json` 的 `files` 包含 `client-locale/*.json`，并且 Host 读取路径一致。

## 确认框背景透明

### 原因

宿主可能对 `[role="dialog"]` 元素有全局样式（例如 `background: transparent !important`），会覆盖普通 CSS 甚至内联背景色。

### 处理

不要把可见背景放在带 `role="dialog"` 的元素上。用外层承载语义、内层承载视觉：

```jsx
<div role="dialog" className="dsdr-confirm">
  <div className="dsdr-confirm-panel" style={{ background: "#1f2328" }}>
    ...
  </div>
</div>
```

## 侧边栏显示 `panel.title`

### 原因

侧边栏标题在插件注册时求值，而页面词典由 `/daily-report/locales` 异步加载，首次求值时词典还不存在。

### 处理

标题函数要有同步兜底：

```js
const value = t("panel.title");
if (value && value !== "panel.title") return value;
return isEnglish ? "Daily report" : "日报汇总";
```
