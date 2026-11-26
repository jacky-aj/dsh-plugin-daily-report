# 当前状态

更新时间：2026-11-19

## 版本

```text
版本号：1.2.0
npm：已发布 1.2.0
```

## 当前状态

- 本地调试策略：profile 保持 npm 安装，不用 link；改完代码 `npm run build && npm run sync:plugin` 同步到已安装目录（见 `docs/runbooks/local-debug.md`）。
- **Host 侧改动必须重启 DSH**，禁用/启用插件不会重新导入已加载的 ES 模块。
- Host / Client 已分离，Client 为 ESM + esbuild bundle。
- 测试统一使用 Vitest：`test/unit/` 单测、`test/integration/` 集成测试。
- 覆盖率门槛：lines 85 / statements 85 / functions 80 / branches 60。
- 所有 HTTP 路由都经过 DSH 的访问校验，见 `docs/decisions/0004-request-gate.md`。
- 已收录进 `awesome-dsh-plugin` 插件市场。

## 当前测试基线

```text
Vitest tests：93 passed
行覆盖：约 87.5%
```

以 `npm run check` 的实际输出为准。

## 最近完成

- Client ESM 化 + esbuild 构建
- 测试目录整理与 Vitest 统一
- 重要操作二次确认（删除数据源、关闭 AI、切换模型、导入设置、启用定时汇总、清除缓存、还原默认配置）
- 页面语言文件移出 `locale/`，修复插件元数据语言文件名校验
- 开关与分体按钮样式对齐
- 定时汇总补跑（最多 7 天）+ 下次运行时间 + 遗漏提示
- 导出文件名附带本地时间戳
- 清除缓存 / 还原默认配置（均需二次确认）
- 路由接入宿主访问校验（1.1.3 安全修复）
- 数据源分组：新建/重命名/删除/切换，分组下拉收在标题右侧（1.2.0）
- 定时汇总关闭时折叠配置（1.2.0）
- 修复扫描目录加仓库不写分组、空分组保存被丢弃（1.2.0）
- AI 分析按天分批；输出侧不传 `maxTokens`（由模型自身决定），截断时对半拆分重试；diff 按信息量取舍（跳过 dist/build/lock，源码优先）（1.1.4）

## 已知问题

- `index.js` 仍有一些 Host 错误分支未覆盖。
- `lib/ai.js`、`lib/collect.js` 的失败分支覆盖率偏低。
- `test/integration/render.spec.mjs` 依赖 `useState` 调用顺序，新增 Hook 后需要调整索引。
- 从 npm 安装时若 profile 中残留旧的本地 junction，会报 EPERM；处理方式见 `docs/troubleshooting.md`。
- 确认框使用内联背景色，后续如果接入完整主题系统需要重新评估。

## 下一步建议

1. 继续提升 Host 路由和 lib 失败分支覆盖率。
2. 评估是否把 `test/integration/render.spec.mjs` 改为更稳定的状态注入方式。
3. 考虑为确认框补键盘 Esc 与焦点管理。
4. 修正 npm 包的 `repository` 字段到 GitHub，让市场能关联下载量。






