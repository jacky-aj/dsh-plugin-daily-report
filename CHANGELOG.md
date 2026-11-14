# Changelog

## 1.1.2 - 2026-11-14

### Added

- 导出成功后显示 toast 提示
- 「仅统计我的提交」取消勾选时二次确认
- 本地调试脚本 `npm run sync:plugin`，把构建产物同步到已安装的 npm 包

### Changed

- 「定时自动生成」更名为「定时汇总」
- 去掉时间范围、定时汇总、Git 仓库、本地文档标题的详情提示
- 调整 AI 分析与数据源配置的说明文案
- 本地调试改为「npm 安装 + 同步产物」，不再使用 link

### Fixed

- 异步确认后受控复选框/开关状态不生效
- 确认框背景透明

## 1.1.1 - 2026-11-12

### Added

- 重要操作二次确认：删除数据源、关闭 AI、切换模型、导入设置、启用定时生成
- 中英文确认文案
- 确认框组件与 `useConfirm` Hook
- 项目长期记忆文档：`AGENTS.md`、`docs/`

### Fixed

- 页面语言文件移出 `locale/`，修复 DSH 插件元数据 “must use a language id as its filename”
- 开关组件调整为更接近 DSH 官方页面的 44×24 轨道和白色滑块
- 异步确认后受控开关状态不生效
- 确认框透明背景
- 侧边栏标题在词典加载前显示 `panel.title`
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
