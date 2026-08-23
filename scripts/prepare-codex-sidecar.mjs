import { chmod, copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { delimiter, join } from "node:path";
import process from "node:process";

const targets = {
  "darwin-arm64": { triple: "aarch64-apple-darwin", vendor: "aarch64-apple-darwin", executable: "codex" },
  "win32-x64": { triple: "x86_64-pc-windows-msvc", vendor: "x86_64-pc-windows-msvc", executable: "codex.exe" }
};
const target = targets[`${process.platform}-${process.arch}`];
if (!target) throw new Error(`Unsupported build target: ${process.platform}-${process.arch}`);

const candidates = [
  process.env.CODEX_SIDECAR_SOURCE,
  process.platform === "darwin" ? "/Applications/ChatGPT.app/Contents/Resources/codex" : undefined,
  join(process.cwd(), "node_modules", "@openai", "codex", "vendor", target.vendor, "codex", target.executable),
  join(process.cwd(), "node_modules", "@openai", "codex", "node_modules", "@openai", `codex-${process.platform}-${process.arch}`, "vendor", target.vendor, "codex", target.executable),
  join(process.cwd(), "node_modules", "@openai", `codex-${process.platform}-${process.arch}`, "vendor", target.vendor, "codex", target.executable),
  ...String(process.env.PATH || "").split(delimiter).map(dir => join(dir, target.executable))
].filter(Boolean);

let source;
for (const candidate of candidates) {
  try { if ((await stat(candidate)).isFile()) { source = candidate; break; } } catch { /* try next */ }
}

async function findExecutable(root, name) {
  let entries;
  try { entries = await readdir(root, { withFileTypes: true }); } catch { return undefined; }
  for (const entry of entries) {
    const candidate = join(root, entry.name);
    if (entry.isFile() && entry.name === name) return candidate;
    if (entry.isDirectory()) {
      const nested = await findExecutable(candidate, name);
      if (nested) return nested;
    }
  }
  return undefined;
}

if (!source) {
  source = await findExecutable(join(process.cwd(), "node_modules", "@openai"), target.executable);
}
if (!source) throw new Error("Codex binary not found. Run npm install --no-save @openai/codex@0.146.0-alpha.9 or set CODEX_SIDECAR_SOURCE.");

const outDir = join(process.cwd(), "src-tauri", "binaries");
const destination = join(outDir, `codex-${target.triple}${process.platform === "win32" ? ".exe" : ""}`);
await mkdir(outDir, { recursive: true });
await copyFile(source, destination);
if (process.platform !== "win32") await chmod(destination, 0o755);
console.log(`Prepared Codex sidecar: ${destination}`);
