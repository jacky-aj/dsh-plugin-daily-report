# 测试

## 命令

```powershell
npm test
npm run test:coverage
npm run check
```

`npm run check` 当前执行：

```text
npm run build
npm run lint
npm run coverage:vitest
```

## 目录

```text
test/unit/          Vitest 单测
test/integration/   Vitest 集成测试
test/fixtures/      静态测试输入
```

不要使用 Node 内置测试运行器。所有测试统一由 Vitest 执行。

## 覆盖率

统计范围：

```text
src/client/**/*.{js,jsx}
lib/**/*.js
index.js
```

当前门槛：

```text
lines      85%
statements 85%
functions  80%
branches   60%
```

当前基线：约 87% 行覆盖。详细数字以 `npm run coverage:vitest` 为准。

覆盖率报告：

```text
coverage/index.html
```

## 单测

适合放在 `test/unit/`：

- 纯函数
- lib 解析 / 格式化 / 提示词
- hooks
- 组件交互
- 确认框
- 构建入口和样式

## 集成测试

适合放在 `test/integration/`：

- Host 路由
- Host Tool
- 构建后的 `client.js` 动作
- 临时 Git 仓库和文档采集
- 设置导入导出
- 生成任务轮询

集成测试可以使用临时目录，但必须清理，不写入仓库。

## 新增测试

1. 先判断是单测还是集成测试。
2. 优先测试用户可见行为和失败分支。
3. 不为了覆盖率写无意义断言。
4. 测试失败先判断产品代码是否有 bug。
5. 不允许通过排除代码或降低门槛掩盖问题。

## 常见坑

### render 集成测试的状态索引

`test/integration/render.spec.mjs` 使用数字 `useState` 调用顺序模拟状态。新增 Hook 后，所有后续状态索引会平移，需要同步调整。

### jsdom

组件测试使用：

```js
// @vitest-environment jsdom
```

需要 `cleanup()`，避免 DOM 在测试间残留。

### 异步确认

确认框返回 Promise。涉及确认的操作，测试要提供 `confirm` mock 或点击确认按钮，否则会等待超时。

### 临时 Git 仓库

Host 集成测试会初始化临时仓库并设置 `DSH_HOME`，测试结束要清理临时目录。
