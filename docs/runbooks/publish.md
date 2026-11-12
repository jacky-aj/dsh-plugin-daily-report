# 发布流程

只有在用户明确要求时才执行。

## 1. 检查

```powershell
npm run check
git status
```

确认：

- 构建通过
- 测试通过
- 覆盖率达标
- 没有临时文件
- `package-lock.json` 未被提交

## 2. 版本

```powershell
npm version patch
```

或按语义化版本选择 `minor` / `major`。

## 3. 提交并推送

```powershell
git add -A
git commit -m "chore: release vX.Y.Z"
git push origin master
```

## 4. 发布 npmjs

```powershell
npm publish --registry=https://registry.npmjs.org/ --access public
```

默认 registry 是内部 Nexus，必须显式指定 npmjs。

## 5. 验证

npm 可能返回 202（处理中），需要轮询：

```powershell
npm view dsh-plugin-daily-report version --registry=https://registry.npmjs.org/
```

确认 latest 为新版本。

## 6. 记录

更新：

- `docs/state.md`
- `CHANGELOG.md`

## 禁止

- 不运行 `npm publish` 以外的发布脚本
- 不发布未通过 `npm run check` 的版本
- 不在用户未要求时提交或推送
