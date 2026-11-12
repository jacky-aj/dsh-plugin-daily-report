# 0002 测试统一使用 Vitest

## 状态

已采用

## 背景

项目最初使用 Node 内置测试运行器，只能覆盖 `lib/`。Client 是拼接产物，无法被准确测试，覆盖率报告也不包含 Host 和 Client 源码。

## 决策

统一使用 Vitest：

```text
test/unit/          Vitest 单测
test/integration/   Vitest 集成测试
```

不再使用 Node 内置测试运行器。`npm test` 直接运行 Vitest。

## 覆盖率

统计范围：

```text
src/client/**/*.{js,jsx}
lib/**/*.js
index.js
```

门槛：

```text
lines      85%
statements 85%
functions  80%
branches   60%
```

## 取舍

- 增加 Vitest、jsdom、Testing Library 依赖。
- 需要为组件准备 jsdom 环境。
- 但单测、组件测试、Host 集成测试和覆盖率可以使用同一套工具。

## 影响

- `test:integration` 脚本删除。
- `test/integration/*.spec.mjs` 由 Vitest 执行。
- `npm run check` 包含 `coverage:vitest`。
