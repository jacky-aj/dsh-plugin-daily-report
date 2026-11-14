#!/usr/bin/env node
// Sync the built plugin from this repository into the DSH profile's installed
// copy of the package. Local debugging never uses `link`; the profile keeps a
// normal npm install, and this script keeps it in step with the repo.
import { readdir, readFile, rm, copyFile, stat, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function toRegex(pattern) {
  let source = "";
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    if (char === "*") {
      if (pattern[i + 1] === "*") {
        i += 1;
        if (pattern[i + 1] === "/") {
          i += 1;
          source += "(?:.*/)?";
        } else {
          source += ".*";
        }
      } else {
        source += "[^/]*";
      }
    } else if (char === "?") {
      source += "[^/]";
    } else if ("\\^$+.()|{}[]".includes(char)) {
      source += "\\" + char;
    } else {
      source += char;
    }
  }
  return new RegExp("^" + source + "$");
}

async function walk(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      files.push(...(await walk(full, base)));
    } else if (entry.isFile()) {
      files.push(relative(base, full));
    }
  }
  return files;
}

function resolveTarget() {
  const explicit = process.argv[2] || process.env.DAILY_REPORT_PLUGIN_DIR;
  if (explicit) return explicit;
  const profile =
    process.env.DSH_PROFILE_DIR ||
    join(homedir(), ".dsh", "profiles", "desktop");
  return join(profile, "node_modules", "dsh-plugin-daily-report");
}

async function main() {
  const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const target = resolveTarget();

  if (!existsSync(target)) {
    throw new Error(
      "找不到已安装的插件目录：" +
        target +
        "\n请先在插件管理器里从 npm 安装，或传入目标目录：node scripts/sync-to-profile.mjs <目录>",
    );
  }
  const installed = JSON.parse(
    await readFile(join(target, "package.json"), "utf8"),
  );
  if (installed.name !== pkg.name) {
    throw new Error(
      "目标目录不是 " + pkg.name + "：" + target + "（实际是 " + installed.name + "）",
    );
  }

  const all = await walk(root);
  const normalized = all.map((file) => file.split(sep).join("/"));
  const matchers = (pkg.files || []).map(toRegex);
  const selected = normalized.filter((file) =>
    matchers.some((matcher) => matcher.test(file)),
  );

  let copied = 0;
  for (const rel of selected) {
    const source = join(root, rel);
    const destination = join(target, rel.split("/").join(sep));
    await mkdir(dirname(destination), { recursive: true });
    // pnpm installs store the package as hard links. Remove first so the copy
    // becomes a real file instead of writing through to the global store.
    await rm(destination, { force: true });
    await copyFile(source, destination);
    copied += 1;
  }

  const stamp = await stat(join(target, "client.js"));
  console.log(
    JSON.stringify(
      {
        ok: true,
        target,
        version: installed.version,
        files: copied,
        clientBytes: stamp.size,
      },
      null,
      2,
    ),
  );
  console.log("已同步。刷新页面并将插件禁用/启用一次即可生效。");
}

main().catch((error) => {
  console.error(String((error && error.message) || error));
  process.exitCode = 1;
});
