# 同步到 GitHub

## 背景

这台机器上 `git push` 到 `github.com` 会被重置：

```text
fatal: unable to access 'https://github.com/...': Recv failure: Connection was reset
```

但 `api.github.com` 和 `raw.githubusercontent.com` 都正常。所以**代码托管在 Gitee，GitHub 作为镜像**，推送 GitHub 走 API 而不是 git 协议。

## 常规流程

```powershell
# 1. 主仓推送（正常 git 协议）
git push origin master

# 2. 镜像到 GitHub（走 API）
npm run mirror:github
```

脚本：`scripts/mirror-to-github.mjs`

做的事情：

1. 用本机 git 凭据里的 GitHub token 调 API
2. 把本地提交里的每个文件按 **git 对象**（不是工作区 CRLF 文件）上传成 blob
3. 基于 GitHub 当前分支的 tree 建新 tree、新 commit、更新 ref

结果与 `git push` 的**内容完全一致**，但**提交号不同**——这是正常的，commit 的 SHA 包含提交者与时间等元数据，两条路径生成的提交不可能同号。

## 参数

```powershell
node scripts/mirror-to-github.mjs <owner/repo> <localSha> [baseSha] [branch] [message]
```

- `owner/repo`：如 `jacky-aj/dsh-plugin-daily-report`
- `localSha`：要镜像的本地提交
- `baseSha`：可省略，默认取 GitHub 当前分支头
- `branch`：默认 `master`

## 验证

对比两边的 blob SHA 就能确认内容一致（blob SHA 是内容哈希）：

```powershell
$h = @{ 'User-Agent'='dsh-agent'; Accept='application/vnd.github+json' }
$ref = Invoke-RestMethod -Uri 'https://api.github.com/repos/jacky-aj/dsh-plugin-daily-report/git/ref/heads/master' -Headers $h
$tree = Invoke-RestMethod -Uri ("https://api.github.com/repos/jacky-aj/dsh-plugin-daily-report/git/trees/" + $ref.object.sha + "?recursive=1") -Headers $h
($tree.tree | Where-Object { $_.path -eq 'lib/ai.js' }).sha
```

和本地比较：

```powershell
git rev-parse HEAD:lib/ai.js
```

两个 SHA 相同即为内容一致。

## 注意

- GitHub 上的提交号与本地的不同，不要用 SHA 判断是否同步，用内容或提交信息。
- 需要**提交号完全一致**时，只能让 `git push` 通（挂代理或换网络），API 镜像做不到。
- 镜像脚本依赖本机 git 凭据存储里的 GitHub token；token 失效时先 `git credential fill` 检查。
- `.gitignore` 已忽略 `pnpm-lock.yaml`、`pnpm-workspace.yaml`：本仓库是库，不维护 lock，误在仓库根目录跑 pnpm 会生成这两个文件并把自身写进 dependencies。
