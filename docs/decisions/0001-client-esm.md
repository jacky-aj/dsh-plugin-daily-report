# 0001 Client ESM 化

## 状态

已采用

## 背景

早期 Client 使用构建时字符串拼接：`src/client.jsx` 加多个 JSX 片段，构建脚本按标记拼接后输出 `client.js`。这种方式可以运行，但：

- 无法直接 import hook / component
- Vitest 无法准确覆盖源码
- 依赖全局变量，模块边界不清
- 修改一个文件容易影响拼接顺序

## 决策

把 Client 改为 ESM + JSX，使用 esbuild bundle。

```text
src/client/index.jsx
  → app.jsx
  → hooks / components / views
  → esbuild
  → client.js
```

构建输出保持 DSH 需要的：

```js
window.__ModuleLoader__.load({
  id: "dsh-plugin-daily-report",
  factory(require) {
    return { inject: ["slots", "locale"], apply };
  },
});
```

React 继续 external。

## 取舍

- 增加构建步骤和 esbuild 依赖。
- 但换来可测试的模块边界和准确的覆盖率。
- `client.js` 仍然是生成产物，必须提交，不能手改。

## 影响

- 删除旧拼接源码和旧构建脚本。
- 新增 `scripts/build-client.mjs`。
- 测试直接 import `src/client/**`。
