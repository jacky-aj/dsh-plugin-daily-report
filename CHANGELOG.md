# Changelog

## Unreleased

### Added

- 重要操作二次确认：删除数据源、关闭 AI、切换模型、导入设置、启用定时生成
- 中英文确认文案
- 确认框组件与 `useConfirm` Hook

### Fixed

- 异步确认后受控开关状态不生效
- 确认框透明背景
- 分体按钮右侧下拉区域左上/左下圆角导致的衔接问题

### Changed

- 测试统一迁移到 Vitest
- 测试目录整理为 `test/unit`、`test/integration`、`test/fixtures`

## 1.1.0

### Added

- Client ESM 化
- esbuild 构建
- Vitest 单测与集成测试
- 全文件覆盖率门槛

### Changed

- 构建入口改为 `src/client/index.jsx`
- 删除旧拼接式 Client 源码

## 1.0.6

### Fixed

- 使用浏览器可访问的 Gitee 仓库地址
