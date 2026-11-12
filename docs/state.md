# 当前状态

更新时间：2026-11-12

## 版本

```text
版本号：1.1.1
npm：已发布 1.1.1
最新提交：本次 1.1.1 发布提交
```

当前 npm latest：1.1.1。

## 当前状态

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

## 已知问题

- `index.js` 仍有一些 Host 错误分支未覆盖。
- `lib/ai.js`、`lib/collect.js` 的失败分支覆盖率偏低。
- `test/integration/render.spec.mjs` 依赖 `useState` 调用顺序，新增 Hook 后需要调整索引。
- 确认框使用内联背景色，后续如果接入完整主题系统需要重新评估。

## 下一步建议

1. 提交并发布二次确认改动前，先人工验证：
   - 删除仓库 / 文档
   - 关闭 AI
   - 切换模型
   - 导入设置
   - 启用定时生成
2. 继续提升 Host 路由和 lib 失败分支覆盖率。
3. 评估是否把 `test/integration/render.spec.mjs` 改为更稳定的状态注入方式。
4. 为确认框补充键盘 Esc / 焦点管理。



