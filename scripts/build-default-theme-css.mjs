import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { build } from "vite";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const entryFile = resolve(projectRoot, "src/presets/default-theme/style-entry.ts");
const outputFile = resolve(projectRoot, "dist/default-theme.css");

const result = await build({
  configFile: false,
  logLevel: "error",
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(projectRoot, "src"),
    },
  },
  build: {
    write: false,
    emptyOutDir: false,
    reportCompressedSize: false,
    cssCodeSplit: false,
    lib: {
      entry: entryFile,
      formats: ["es"],
      fileName: () => "__default-theme-style__",
    },
  },
});

const outputs = Array.isArray(result) ? result : [result];
let cssSource = null;

for (const output of outputs) {
  if (!("output" in output)) {
    continue;
  }

  for (const artifact of output.output) {
    if (artifact.type === "asset" && artifact.fileName.endsWith(".css")) {
      cssSource = artifact.source;
      break;
    }
  }

  if (cssSource !== null) {
    break;
  }
}

if (cssSource === null) {
  throw new Error("Failed to generate the default-theme.css asset.");
}

await mkdir(dirname(outputFile), { recursive: true });
await writeFile(outputFile, cssSource);
