# 0003 重要操作二次确认

## 状态

已采用

## 背景

部分设置修改会删除数据、覆盖配置或产生额外成本，需要二次确认。但所有操作都加确认会显著拖慢高频编辑。

## 决策

### 需要确认

- 删除 Git 仓库
- 删除本地文档
- 关闭 AI 分析
- 切换 AI 模型
- 导入设置
- 启用定时生成
- 清除缓存
- 还原所有默认配置

### 不需要确认

- 启用 AI 分析（默认启用）
- 关闭定时生成
- 编辑仓库地址、分支、标签
- 修改导出格式
- 测试数据源、扫描目录
- 导出预览
- 删除单条手动工作项

## 实现

```text
src/client/components/ConfirmDialog.jsx
src/client/hooks/useConfirm.js
```

`confirm(options)` 返回 Promise，确认返回 `true`，取消或点击遮罩返回 `false`。

## 重要修复

异步确认后不能直接读取 `event.target.checked`：

```js
const nextChecked = event.target.checked;
const accepted = await confirm(...);
if (!accepted) return;
setUseAi(nextChecked);
```

否则受控 checkbox 会在等待期间恢复旧值，导致确认后设置不生效。

## 取舍

- 确认框使用固定深色实色背景，不依赖宿主主题变量。
- 不使用 `window.confirm`，避免样式不可控和阻塞式交互。

