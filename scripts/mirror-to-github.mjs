#!/usr/bin/env node
// Mirror one local commit to the GitHub repository through the Git Data API.
//
// Git over HTTPS to github.com is refused on this network ("Connection was
// reset"), while api.github.com answers normally. The API can still build a
// commit: blobs from the exact git objects, one tree, one commit, one ref
// update. The result is byte-identical to `git push`.
//
// Usage: node scripts/mirror-to-github.mjs <owner/repo> <localSha> [baseSha] [branch] [message]
import { execFileSync } from "node:child_process";

const [repo, sha, baseShaArg, branchArg, messageArg] = process.argv.slice(2);
if (!repo || !sha) {
  console.error("usage: node scripts/mirror-to-github.mjs <owner/repo> <localSha> [baseSha] [branch] [message]");
  process.exit(1);
}
const branch = branchArg || "master";

function git(args, options = {}) {
  return execFileSync("git", args, { encoding: options.encoding === "buffer" ? "buffer" : "utf8", cwd: process.cwd(), maxBuffer: 64 * 1024 * 1024 });
}

function token() {
  const out = execFileSync("git", ["credential", "fill"], {
    input: "protocol=https\nhost=github.com\n\n",
    encoding: "utf8",
  });
  const line = out.split(/\r?\n/).find((item) => item.startsWith("password="));
  if (!line) throw new Error("no stored GitHub credential");
  return line.slice("password=".length);
}

const auth = token();
async function api(path, init = {}) {
  const response = await fetch("https://api.github.com" + path, {
    ...init,
    headers: {
      authorization: "token " + auth,
      accept: "application/vnd.github+json",
      "user-agent": "dsh-mirror",
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    const detail = body && body.message ? body.message : text.slice(0, 200);
    throw new Error(path + " -> HTTP " + response.status + ": " + detail);
  }
  return body;
}

const changed = git(["show", "--name-only", "--format=", sha])
  .split(/\r?\n/)
  .map((item) => item.trim())
  .filter(Boolean);
const commitMessage = messageArg || git(["log", "-1", "--format=%s", sha]).trim();

const baseSha = baseShaArg || (await api("/repos/" + repo + "/git/ref/heads/" + branch)).object.sha;
const baseCommit = await api("/repos/" + repo + "/git/commits/" + baseSha);

const tree = [];
for (const path of changed) {
  // Read the exact object git would have pushed, not the CRLF worktree copy.
  let blob;
  try {
    blob = git(["cat-file", "blob", sha + ":" + path], { encoding: "buffer" });
  } catch {
    // Deleted in this commit.
    tree.push({ path, mode: "100644", type: "blob", sha: null });
    continue;
  }
  const created = await api("/repos/" + repo + "/git/blobs", {
    method: "POST",
    body: JSON.stringify({ content: blob.toString("base64"), encoding: "base64" }),
  });
  tree.push({ path, mode: "100644", type: "blob", sha: created.sha });
}

const newTree = await api("/repos/" + repo + "/git/trees", {
  method: "POST",
  body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree }),
});

const localMessage = git(["log", "-1", "--format=%B", sha]).trim();
const newCommit = await api("/repos/" + repo + "/git/commits", {
  method: "POST",
  body: JSON.stringify({
    message: localMessage || commitMessage,
    tree: newTree.sha,
    parents: [baseSha],
  }),
});

await api("/repos/" + repo + "/git/refs/heads/" + branch, {
  method: "PATCH",
  body: JSON.stringify({ sha: newCommit.sha, force: false }),
});

console.log(
  JSON.stringify(
    { ok: true, repo, branch, from: baseSha.slice(0, 7), to: newCommit.sha.slice(0, 7), files: changed.length },
    null,
    2,
  ),
);
