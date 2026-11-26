# 架构

## 1. Host 与 Client

插件分为 Host 和 Client 两部分。

```text
DSH Host
  index.js
    ├─ /daily-report/* HTTP 路由
    ├─ 生成任务管理
    ├─ 调度与历史文件
    └─ daily_report Tool
  lib/
    ├─ collect.js
    ├─ ai.js
    ├─ report.js
    ├─ formats.js
    ├─ i18n.js
    └─ xlsx.js

DSH Web Client
  src/client/
    ├─ index.jsx
    ├─ app.jsx
    ├─ hooks/
    ├─ components/
    ├─ views/
    └─ styles.css
```

Client 通过 `/daily-report/*` 调用 Host，不直接访问文件系统或 Git。

## 2. Client 构建

入口：

```text
src/client/index.jsx
```

构建：

```text
esbuild bundle
  → React external
  → 注入 styles.css
  → 包装为 window.__ModuleLoader__.load({ id, factory(require) })
  → client.js
```

约束：

- `client.js` 是生成产物，不能手改。
- React 由 DSH 提供，不能打进 bundle。
- 构建脚本：`scripts/build-client.mjs`。
- `npm publish` 前会通过 `prepublishOnly` 自动构建。

## 3. 页面状态

`app.jsx` 组合所有 Hook，生成一个 `app` 对象，通过 `AppContext` 提供给页面。

主要 Hook：

| Hook | 职责 |
|---|---|
| `useSettings` | 加载设置、AI 信息、日期范围、导出格式 |
| `useMenus` | 格式菜单、设置菜单、外部点击关闭 |
| `useConfirm` | 重要操作二次确认 |
| `useSettingsTransfer` | 设置保存、导入、导出、清除缓存、还原默认配置 |
| `useDataSources` | Git / 文档数据源编辑、分组切换、批量增删、扫描、测试 |
| `useGeneration` | 生成任务、轮询、取消 |
| `usePreview` | 预览编辑、导出、单日重新分析 |
| `useSchedule` | 定时生成状态和立即运行 |

页面区块：

```text
DailyReportPage
  ├─ RangeCard
  ├─ AiCard
  ├─ ScheduleCard
  ├─ DataSourceCard
  └─ PreviewCard
```

## 4. 生成流程

```text
Client generate()
  → POST /daily-report/generate/start
  → Host 创建 job
  → Client 轮询 GET /daily-report/job?jobId=...
  → Host collectReport()
  → 可选 analyzeReport()
  → 生成临时 XLSX
  → Client GET /daily-report/job/preview
  → 用户编辑预览
  → POST /daily-report/job/export
```

同步接口 `/daily-report/generate` 仍保留，供工具和兼容调用使用。

## 5. AI 分析

- 模型选择：默认模型或页面指定 provider/model。
- 提示词：`lib/ai.js` 的 `buildAiPrompt`。
- 按天分析，带缓存；未变化日期复用缓存。
- 失败时仍生成普通日报，并在结果中返回警告。
- 关闭 AI 需要确认；启用 AI 不需要确认。

## 6. 二次确认

确认框由以下文件实现：

```text
src/client/components/ConfirmDialog.jsx
src/client/hooks/useConfirm.js
```

需要确认：

- 删除 Git 仓库 / 本地文档
- 关闭 AI 分析
- 切换 AI 模型
- 导入设置
- 启用定时生成

不需要确认：

- 启用 AI
- 关闭定时生成
- 编辑数据源字段
- 测试数据源、扫描目录
- 导出、修改格式
- 删除单条手动工作项

## 7. i18n

- Host 文案：`lib/locales/zh.js`、`lib/locales/en.js`
- 页面文案：`client-locale/page.zh.json`、`client-locale/page.en.json`
- Client 通过 `/daily-report/locales` 获取页面词典。
- 组件中使用 `t(key, fallback)`。

## 8. 测试

```text
test/unit/          Vitest 单测
test/integration/   Vitest 集成测试，包含 Host、构建产物、页面动作
test/fixtures/      静态测试输入
```

覆盖率统计范围：

```text
src/client/**/*.{js,jsx}
lib/**/*.js
index.js
```

详见 `docs/testing.md`。

## 9. 路由访问校验

所有 `/daily-report/*` 路由都由 `registerRoute` 统一包装，在进入 handler 之前先问宿主的 `ctx.connection.requestRejection(req)`：

```js
const refused = ctx.connection.requestRejection(req); // 401 | 403 | undefined
if (refused !== undefined) return sendRefusal(res, refused);
```

原因：这些路由是 `webServer` 的 `exact` 注册，不会经过 DSH 的 `/api` 前缀围栏；而 `isLoopback` 挡不住浏览器里的页面（请求对端就是 127.0.0.1）。

- 宿主决定是否放行（Host/Origin 围栏 + 浏览器登录），插件不自己再写一套规则
- 宿主缺少该服务时退回 `isLoopback`，行为与旧版一致
- 宿主校验抛异常按 403 处理

详见 `docs/decisions/0004-request-gate.md`。

