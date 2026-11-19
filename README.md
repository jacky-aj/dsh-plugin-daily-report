<h1 align="center">日报汇总</h1>

<p align="center">
  把散落在多个 Git 仓库、分支和本地文档里的工作，<br>
  自动整理成一份可以直接汇报的日报。
</p>

<p align="center">
  <img alt="npm version" src="https://img.shields.io/npm/v/dsh-plugin-daily-report?color=146b5a">
  <img alt="license" src="https://img.shields.io/npm/l/dsh-plugin-daily-report?color=146b5a">
  <img alt="DSH" src="https://img.shields.io/badge/DSH-%3E%3D0.2.2--rc.1-146b5a">
</p>

<p align="center">
  <a href="https://gitee.com/yuanjiegit/dsh-plugin-daily-report">Gitee 仓库</a>
  ·
  <a href="https://gitee.com/yuanjiegit/dsh-plugin-daily-report/issues">问题反馈</a>
</p>

---

## 项目文档

- [AGENTS.md](AGENTS.md)：模型进入项目时的入口和硬性约定
- [docs/state.md](docs/state.md)：当前状态、已知问题和下一步
- [docs/architecture.md](docs/architecture.md)：Host / Client 架构和数据流
- [docs/conventions.md](docs/conventions.md)：代码、CSS、i18n、发布约定
- [docs/testing.md](docs/testing.md)：测试和覆盖率规则
- [docs/troubleshooting.md](docs/troubleshooting.md)：安装报错、语言文件、确认框样式等常见问题
- [docs/runbooks/local-debug.md](docs/runbooks/local-debug.md)：本地调试与同步到已安装包
- [docs/runbooks/market-submit.md](docs/runbooks/market-submit.md)：提交到 DSH 插件市场
- [docs/decisions/](docs/decisions/)：架构决策记录
- [CHANGELOG.md](CHANGELOG.md)：版本变更

## 解决你的需求

- **月底不知道自己干了哪些活？**
- **明明感觉干了很多，但是没有记录？**
- **领导要求汇报？**
- **改动涉及多处，很难收集统计？**

**这些统统可以解决。**

它不是简单地把 `git log` 导成 Excel，而是把多个仓库、多个分支、代码变更、本地文档和会议记录，按天整理成一份**有内容、可编辑、能直接汇报**的日报。

## 你会得到什么

- 一份按天归集的完整工作记录，不再靠回忆拼凑
- 一份经过 AI 提炼的日报总结，直接可用
- 一个可以修改、补充、重新分析的预览页面
- 一份可以导出的 XLSX / Markdown / CSV / HTML 文件
- 一个每天或每周自动生成、自动归档的定时任务

## 为什么是它

| 你的问题 | 它怎么解决 |
|---|---|
| 工作散落在多个仓库和分支 | 一次配置多个 Git 源，自动合并统计 |
| 只记得写代码，忘了开会和沟通 | 手动补充非代码工作项，统一进入日报 |
| 提交很多，但不知道怎么总结 | AI 按天提炼完成、修复和排查内容 |
| 生成结果不能改 | 先预览、编辑、重新分析，再导出 |
| 每次汇报都要重新整理 | 设置一次，之后一键生成或定时生成 |
| 只会导出 XLSX | 支持 XLSX、Markdown、CSV、HTML |

> **30 秒上手**：安装 `dsh-plugin-daily-report` → 左侧打开「日报汇总」→ 点「扫描目录」批量添加仓库 → 选择时间范围 → 生成日报。

---

## 完整功能

- **Git 数据源**：支持多个远程仓库地址（https / ssh / git / file）或本地仓库路径，每个源可指定分支；远程仓库使用裸仓库缓存，首次拉取后再次生成会复用缓存。
- **本地文档**：支持单个文件或目录；目录递归扫描 `.md`、`.markdown`、`.mdx`、`.txt`、`.text`、`.log`、`.docx`、`.html`、`.htm`。自动跳过 `.git`、`node_modules`、`dist`、`build` 等目录。
- **按天归集**：Git 按提交作者时间归入日期；文档优先取文件名中的日期，其次取文档内 `date:` / `日期:` 字段，最后使用文件修改时间。
- **时间范围**：默认当月月初到月底，可在页面中改为任意范围（最长 366 天）。
- **仅统计我的提交（默认开启）**：按每个仓库的 `git config user.email` / `user.name` 过滤；可手动填写一个或多个作者邮箱，默认排除 merge commit。
- **AI 分析（默认启用）**：使用当前默认模型，结合提交说明、代码 diff 片段和文档摘要，按天生成简要总结；支持简洁/详细/管理汇报三种风格，可选择模型。结果写入「日报汇总」的 AI 分析列和独立的「AI分析」工作表。
- **AI 增量缓存**：按“模型 + 日期 + 提交/diff/文档内容”缓存每日分析结果，只重新分析新增或变化的日期；缓存命中会在进度和结果中显示。缓存文件为 `$DSH_HOME/daily-report/ai-cache.json`。
- **生成结果预览**：生成后先进入预览页，可编辑总体总结、每日 AI 摘要，添加手动工作项，确认后再导出所选格式；支持对单日重新调用模型分析。每日条目默认折叠，可单日展开或使用「全部展开/全部收起」。
- **手动补充工作项**：会议、沟通、线上支持等非代码工作可按天补充，导出时进入「手动补充」列。
- **设置导出/导入**：「保存设置」右侧下拉菜单可导出当前配置为 JSON，或从 JSON 文件导入；导入后会立即保存并生效。
- **统一数据源配置**：Git 仓库和本地文档归入「数据源配置」卡片，通过「Git 仓库 / 本地文档」页签切换；测试数据源也在这里统一操作。
- **从目录批量添加仓库**：在 Git 仓库页签点击「扫描目录」，选择或输入目录后自动识别最多 6 层内的 Git 仓库，读取当前分支并批量加入；已存在的仓库会自动跳过。
- **设置持久化**：Git 仓库、文档、AI 分析、作者过滤、模型、日期范围、导出格式和定时生成设置都会保存到 `settings.json`，下次打开页面保持一致；修改后会自动保存，也可以点击右上角「保存设置」立即保存。
- **生成进度**：生成任务异步执行，页面实时显示当前阶段、百分比和 AI 已接收字数；支持取消和失败重试。
- **数据源测试**：一键测试当前 Git/文档源，提前发现路径、分支和权限问题。
- **定时自动生成**：可设置每天或每周一固定时间自动生成，结果保存到 `$DSH_HOME/daily-report/history`。页面会显示上次生成时间、运行状态、错误信息和历史文件下载链接，并支持「立即运行一次」。自动生成在 DSH 运行期间执行，启动后会补跑当天尚未执行的任务。
- **XLSX 输出**：工作簿包含【日报汇总】【AI分析】（启用时）【Git明细】【文档明细】【数据源】【说明】工作表，带表头样式、冻结窗格、筛选和列宽。日报汇总冻结日期/星期/日类型三列，Git 明细冻结日期/仓库/分支，左右滚动时保持可见。
- **多格式导出**：右上角「生成日报」支持下拉选择 XLSX、Markdown、CSV、HTML，默认 XLSX；所选格式会保存到 `settings.json`，预览页的导出按钮会跟随格式变化。
- **独立页面**：左侧全局菜单新增「日报汇总」入口，点击后在中栏打开独立页面，不依附于任何会话。
- **两种入口**：左侧「日报汇总」页面；同时注册 `daily_report` Agent 工具，便于在对话中直接生成。

## 安装

在 DSH 的「设置 → 插件」中安装 npm 包：

```text
dsh-plugin-daily-report
```

或通过插件管理器安装：

```text
plugin_manager
  action: install_bundle
  target: dsh-plugin-daily-report
```

安装后刷新 DSH 页面，左侧会出现「日报汇总」入口。不要把本包只 `npm install -g` 到 Node 全局目录；DSH 需要把它作为当前 profile 的 bundle 安装。

## 首次配置

首次安装没有预置仓库，页面打开后可以：

- 点击「扫描目录」，选择 `E:\sunline\SBG` 这类目录，批量识别其中的 Git 仓库和当前分支；
- 或者手动添加仓库地址/本地路径和分支；
- 添加本地文档或目录；
- 选择日期范围后生成日报。

页面中可随时增删、修改仓库或分支；修改后会保存到 `settings.json`。

## 使用

1. 点击左侧菜单底部的「日报汇总」图标，在中栏打开独立页面。
2. 添加 Git 仓库：填写远程地址或本地路径，分支留空时使用默认分支；也可以点击「扫描目录」，指定一个包含多个仓库的目录，批量识别其中的仓库和当前分支。
3. 添加本地文档：填写文件或目录的绝对路径。
4. 选择日期范围（默认当月，也可用「昨天」「本周」等快捷按钮），按需勾选「启用 AI 分析」，在右上角「生成日报」下拉中选择格式；选择格式会立即生成，直接点击主按钮则按当前格式生成。
5. 生成完成后先在预览区检查：编辑总体/每日 AI 摘要、对某天重新分析、补充手动工作项，确认后点击导出按钮下载当前选择的格式。

Git 仓库、文档、AI 分析开关、作者过滤、格式、日期范围和自动生成设置会自动保存在 `$DSH_HOME/daily-report/settings.json`，跨会话与重启有效。自动生成的历史文件保存在 `$DSH_HOME/daily-report/history`。

## Agent 工具

工具名：`daily_report`。参数：

| 参数 | 说明 |
|---|---|
| `start` / `end` | 可选，`YYYY-MM-DD`；省略时使用当月 |
| `git` | 可选，`[{ location, branch, label }]`；省略时使用已保存配置 |
| `docs` | 可选，字符串数组；省略时使用已保存配置 |
| `outputPath` | 可选，输出路径；省略时写入当前会话工作目录 |
| `ai` | 可选，布尔值；`true` 时调用当前默认模型分析提交 diff 与文档摘要 |
| `format` | 可选，`xlsx` / `markdown` / `csv` / `html`，默认 `xlsx` |
| `locale` | `zh` / `en` |

## 结构

| 文件 | 作用 |
|---|---|
| `index.js` | Host 半侧：本地 HTTP 接口、设置持久化、`daily_report` 工具 |
| `client.js` | Web 半侧：由 `src/client` 构建生成的最终 Client 产物 |
| `src/client/index.jsx` | Web 半侧 ESM 入口 |
| `src/client/app.jsx` | 状态、数据请求与页面组合 |
| `src/client/styles.css` | 页面样式 |
| `src/client/components/*.jsx` | Button、Switch、Card 等基础组件 |
| `src/client/hooks/*.js` | 设置、数据源、生成、预览、定时等 hooks |
| `src/client/views/*.jsx` | 时间范围、AI、定时生成、数据源、预览等页面区块 |
| `client-locale/page.zh.json` | Web 页面中文文案 |
| `client-locale/page.en.json` | Web 页面英文文案 |
| `scripts/build-client.mjs` | 将 ESM Client bundle 为 DSH 产物 |
| `lib/collect.js` | Git 日志、作者过滤、文档扫描、按天归集、仓库目录扫描 |
| `lib/ai.js` | AI 提示词、按天分析、增量缓存、单日重新分析 |
| `lib/report.js` | XLSX 工作表内容与样式 |
| `lib/formats.js` | Markdown、CSV、HTML 日报渲染 |
| `lib/i18n.js` | Host 侧多语言查找与插值 |
| `lib/locales/zh.js` | Host 报表、格式、AI 提示文案 |
| `lib/locales/en.js` | Host 英文文案 |
| `lib/xlsx.js` | 无第三方依赖的 XLSX（ZIP + SpreadsheetML）写入器 |
| `cordis.patch.yml` | 插入 `daily-report` 插件行 |
| `locale/*.json` | 插件管理器展示文案 |
| `icon.svg` | 插件图标 |

## 开发

Web 页面源码在 `src/client/`，使用 JSX + ESM 编写；`client.js` 是构建产物，不要直接修改。页面文案放在 `client-locale/page.zh.json` 和 `client-locale/page.en.json`，由 Host 的 `/daily-report/locales` 接口提供给 Client，不再打进 `client.js`。

```powershell
npm install
npm run build
```

`npm publish` 前会自动执行构建。React 由 DSH 提供，不重复打包。

### 测试

```powershell
npm test
npm run test:coverage
npm run check
```

- `npm test`：Vitest 单测 + 集成测试
- `npm run test:coverage`：Vitest 全量覆盖率
- `npm run check`：构建 + ESLint + 全量覆盖率

测试目录：

```text
test/unit/         Vitest 单测
test/integration/  Vitest 集成测试
test/fixtures/     静态测试输入
```

全量覆盖率：

```text
All files               lines 87.18%  functions 81.09%  branches 62.14%
Vitest  src/client/**   lines 92.29%  functions 89.47%  branches 58.09%
Vitest  lib/**          lines 86.31%  functions 94.39%  branches 66.57%
Vitest  index.js        lines 81.87%  functions 88.09%  branches 56.00%
```

Vitest 门槛：

```text
lines      85%
statements 85%
functions  80%
branches   60%
```

Vitest 门槛：

```text
lines      85%
statements 85%
functions  80%
branches   60%
```

`index.js` 的 Host 路由已纳入 Vitest 集成测试和全量覆盖率统计。

## 说明与边界

- Git 读取使用系统 `git`，沿用本机已有的 HTTPS credential helper / SSH agent；HTTP 克隆设置 `GIT_TERMINAL_PROMPT=0`，不会在后台弹出密码提示。
- 单次最多读取 5000 条提交、3000 个文档；单个文档最大 2 MB；Git 明细中每个提交最多列出 50 个变更文件。
- 不解析 PDF、Excel、图片或加密文档；这些文件不会进入日报。
- 「仅统计我的提交」使用每个仓库的 `git config user.email` / `user.name`；远程裸仓库缓存没有仓库级用户配置时会回退到全局配置，若匹配不到可在页面关闭该过滤。
- AI 分析会读取每个仓库前 60 条提交的代码 diff 片段（每条最多约 1200 字符），并使用当前默认模型；会产生额外的生成时间和 token 消耗。模型调用失败时仍会生成普通日报，并在提示中说明失败原因。
- AI 缓存只复用未变化的日期；提交、diff、文档摘要或模型变化后会重新分析对应日期。
- 所有处理在本机完成，不上传仓库或文档内容；启用 AI 分析时，会把上述有界摘要发送给当前配置的模型服务。






