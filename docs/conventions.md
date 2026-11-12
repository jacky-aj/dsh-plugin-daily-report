# 约定

## 代码

- Client 使用 ESM + JSX，一个文件一个主要导出。
- Host 和 `lib/` 使用 Node ESM。
- 不直接编辑 `client.js`。
- 不重复打包 React。
- 优先小函数和显式数据流，避免隐式全局状态。
- 新增 Hook 时保持参数对象可读，并在 `app.jsx` 中集中注入。

## CSS

- 页面样式统一写在 `src/client/styles.css`。
- 修改 `.dsdr-split`、`.dsdr-btn`、`.dsdr-menu` 等通用类时，检查是否影响其他组件。
- 专用类被通用类覆盖时，提高选择器特异性，例如：
  ```css
  .dsdr-split > .dsdr-split-toggle { ... }
  ```
- 确认框等浮层使用明确实色背景，不依赖可能缺失或半透明的主题变量。
- 浮层设置足够的 `z-index` 和 `pointer-events: auto`。

## React

- 受控输入的事件值如果要在 `await` 后使用，必须先保存：
  ```js
  const nextChecked = event.target.checked;
  await confirm(...);
  setUseAi(nextChecked);
  ```
- 异步操作要处理错误并给出可读提示。
- 删除、覆盖、外部调用等不可逆或高成本操作才加二次确认。
- 高频、可逆、低风险操作不加二次确认。

## i18n

- 页面文案使用 `t(key, fallback)`。
- 新增 key 同时更新：
  - `locale/page.zh.json`
  - `locale/page.en.json`
- Host 文案变更同时更新：
  - `lib/locales/zh.js`
  - `lib/locales/en.js`

## 错误处理

- Host 路由返回统一 JSON 错误结构。
- Client 使用 `errorMessageFromPayload` 提取错误信息。
- 不把内部堆栈直接展示给用户。
- AI 失败不能阻断普通日报生成。

## Git 与发布

- 不主动 commit、push 或 publish，除非用户明确要求。
- 发布前运行 `npm run check`。
- npmjs 发布使用：
  ```powershell
  npm publish --registry=https://registry.npmjs.org/ --access public
  ```
- 发布后轮询确认版本生效。
- `package-lock.json` 已在 `.gitignore` 中。

## 文档

- 行为变化更新 `docs/state.md` 和 `CHANGELOG.md`。
- 架构取舍新增 `docs/decisions/NNNN-*.md`。
- 不把完整聊天记录写入仓库。
