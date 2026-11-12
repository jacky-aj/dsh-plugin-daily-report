import { parseGitLog } from "../../lib/collect.js";

const raw =
  "\u001ead4e66b6c4b13fd09f873ef6f0d6fcb8a6b73b60\u001f袁杰\u001fyuanjie@example.com\u001f2026-11-02T16:00:00+08:00\u001f更新接口文档\nA\tapi.md\n\n\u001e165562a4aa9cb58790f94a62b4c8194a76e59d10\u001f袁杰\u001fyuanjie@example.com\u001f2026-11-02T15:30:00+08:00\u001f修复工作台任务统计跳转\nA\tworkbench.js\n\n\u001e1581226cc441c35d22d2549d5f31db47ac65772f\u001f袁杰\u001fyuanjie@example.com\u001f2026-11-01T10:00:00+08:00\u001f实现参数平台快捷键栏位帮助\nA\tparam.js\n";

const commits = parseGitLog(raw, { start: "2026-11-01", end: "2026-11-30" });
console.log(JSON.stringify(commits, null, 2));

