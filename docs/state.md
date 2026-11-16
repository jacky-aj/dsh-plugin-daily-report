# 当前状态

更新时间：2026-11-12

## 版本

```text
版本号：1.1.2
npm：已发布 1.1.2
最新提交：本次 1.1.2 发布提交
```

当前 npm latest：1.1.2。

## 当前状态

- 本地调试策略：profile 保持 npm 安装，不用 link；改完代码 `npm run build && npm run sync:plugin` 同步到已安装目录（见 `docs/runbooks/local-debug.md`）。

- Host / Client 已分离。
- Client 已迁移为 ESM + esbuild bundle。
- 测试已全部迁移到 Vitest，不再使用 Node 测试运行器。
- `test/unit/` 为 Vitest 单测，`test/integration/` 为 Vitest 集成测试。
- 覆盖率门槛已配置：lines 85 / statements 85 / functions 80 / branches 60。
- 重要操作二次确认已实现，但尚未提交和发布。

## 当前测试基线

```text
Vitest tests：63 passed
覆盖率：约 87% 行覆盖
```

以 `npm run check` 的实际输出为准。

## 最近完成

- Client ESM 化
- esbuild 构建
- Vitest 单测和集成测试
- 测试目录整理：unit / integration / fixtures
- 重要操作二次确认
- 确认框透明背景修复\n- 页面语言文件移出 `locale/`，修复 DSH 插件元数据语言文件名校验错误\n- 开关组件样式对齐 DSH 官方页面\n- 异步确认后复选框状态不生效修复

## 工作区未发布

- 定时汇总补跑（最多 7 天，`lib/schedule.js`）
- 导出文件名附带时间戳
- 定时状态新增 `nextRunAt` / `pending` / `lastCatchUp`
- 本地调试结论：Host 侧改动必须重启 DSH，禁用/启用插件不会重新导入 ES 模块
- 清除缓存（`POST /daily-report/cache/clear`）：删 AI 缓存与 repos 裸克隆
- 还原默认配置（`POST /daily-report/settings/reset`）：写回默认设置
- 两者都必须二次确认

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













