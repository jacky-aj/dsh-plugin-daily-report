import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(root, "src", "client", "index.jsx");

const result = await build({
  entryPoints: [entry],
  bundle: true,
  write: false,
  format: "iife",
  globalName: "__DSH_DAILY_REPORT__",
  external: ["react"],
  jsx: "transform",
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
  platform: "browser",
  target: "es2020",
  legalComments: "none",
  plugins: [
    {
      name: "raw-css",
      setup(build) {
        build.onResolve({ filter: /\?raw$/ }, (args) => ({
          path: join(args.resolveDir, args.path.replace(/\?raw$/, "")),
          namespace: "raw",
        }));
        build.onLoad({ filter: /.*/, namespace: "raw" }, async (args) => ({
          contents: await readFile(args.path, "utf8"),
          loader: "text",
        }));
      },
    },
  ],
});

const code = result.outputFiles[0].text;
const wrapped = `window.__ModuleLoader__.load({
  id: "dsh-plugin-daily-report",
  factory(require) {
${code}
    return { inject: ["slots", "locale"], apply: __DSH_DAILY_REPORT__.apply };
  },
});
`;
await writeFile(join(root, "client.js"), wrapped, "utf8");
console.log("built client.js (" + wrapped.length + " bytes)");


