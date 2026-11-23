# AGENTS.md

本文件是模型进入本仓库时的入口。先读这里，再读 `docs/state.md`。

## 项目

`dsh-plugin-daily-report`：DSH 日报插件。汇总多个 Git 仓库、分支和本地文档，生成按天日报，支持 AI 分析、预览编辑和 XLSX / Markdown / CSV / HTML 导出。

当前版本：`1.1.4`。
仓库：`https://gitee.com/yuanjiegit/dsh-plugin-daily-report`

## 每次会话开始

```powershell
git status
git log -5 --oneline
npm run check
```

然后按顺序阅读：

1. `docs/state.md`：当前状态、已知问题、下一步
2. `docs/architecture.md`：模块地图和数据流
3. `docs/conventions.md`：必须遵守的约定
4. 最近修改相关的 `docs/decisions/*.md`

## 必须遵守

- `client.js` 是构建产物，不能直接手改。
- 页面源码在 `src/client/`，构建脚本是 `scripts/build-client.mjs`。
- Host 路由和工具在 `index.js`，业务逻辑在 `lib/`。
- 测试统一使用 Vitest：`test/unit/` 和 `test/integration/`。
- 修改行为后同步更新 `docs/state.md`；架构或取舍变化时新增 ADR。
- 本地调试不使用 `link` / junction：profile 保持从 npm 安装，改完代码用 `npm run sync:plugin` 同步到已安装目录，详见 `docs/runbooks/local-debug.md`。
- 不要主动 commit、push 或 publish，除非用户明确要求。
- 不掩盖测试发现的问题。测试失败先判断是产品代码 bug 还是测试假设错误。
- 覆盖率门槛不能为了通过而调低。

## 常用命令

```powershell
npm run build        # 构建 client.js
npm test             # 全部 Vitest 单测和集成测试
npm run test:coverage
npm run check        # build + lint + 覆盖率
npm run sync:plugin  # 把构建产物同步到已安装的 npm 包目录
```

## 架构地图

```text
index.js                 Host 路由、Tool、调度、状态持久化
lib/
  collect.js             Git / 文档采集
  ai.js                  AI 提示词、模型调用、缓存
  report.js              XLSX 工作簿
  formats.js             Markdown / CSV / HTML
  schedule.js            定时汇总的补跑与下次运行时间
  i18n.js                服务端文案
  locales/               服务端中英文词典
src/client/
  index.jsx              Client 入口
  app.jsx                状态编排、Hook 组合、页面容器
  hooks/                 设置、数据源、生成、预览、定时等
  components/            基础组件和确认框
  views/                 页面区块
  styles.css             页面样式
client-locale/page.zh.json      页面中文文案
client-locale/page.en.json      页面英文文案
test/unit/               Vitest 单测
test/integration/        Vitest 集成测试
```

## 关键约定

- 所有 HTTP 路由经 `registerRoute` 包装，先过 `ctx.connection.requestRejection(req)`；不要删掉这层校验，也不要在 handler 里另写准入规则（见 `docs/decisions/0004-request-gate.md`）。

- Client 使用 ESM + JSX；React 由 DSH 提供，不能重复打包。
- 构建输出必须保持 `window.__ModuleLoader__.load({ id, factory(require) })`。
- 页面开关类事件如果 `await confirm(...)`，必须在 `await` 前保存 `event.target.checked`。
- 重要但低频的操作才加二次确认，高频低风险操作不要加。
- 修改 CSS 时注意选择器顺序和优先级；通用 `.dsdr-btn` 可能覆盖专用类。
- 页面文案优先使用 `t(key, fallback)`，新增文案同步 `client-locale/page.zh.json` 和 `client-locale/page.en.json`。
- 发布前必须运行 `npm run check`。

## 常见坑

- `test/integration/render.spec.mjs` 依赖 `useState` 调用顺序；新增 Hook 后需要同步调整 mock 索引。
- 确认框按钮使用原生 `<button>`，不要依赖宿主按钮样式。
- 宿主主题变量可能缺失或本身半透明；确认框背景使用明确的实色或内联样式。
- npm 默认 registry 是内部 Nexus；发布 npmjs 时要显式 `--registry=https://registry.npmjs.org/`。
- npm 发布返回 202 时表示处理中，需要轮询 registry 确认版本生效。
- `package-lock.json` 已被忽略，不要提交。

## 会话结束

1. 运行 `npm run check`。
2. 更新 `docs/state.md` 的当前状态、已知问题和下一步。
3. 行为变化更新 `CHANGELOG.md`。
4. 架构取舍变化新增 `docs/decisions/NNNN-*.md`。
5. 不主动提交或发布。









