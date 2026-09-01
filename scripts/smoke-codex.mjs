import { spawn } from "node:child_process";
import readline from "node:readline";
import { join } from "node:path";

const binary = process.env.CODEX_SIDECAR_SOURCE || join(process.cwd(), "src-tauri", "binaries", "codex-aarch64-apple-darwin");
const child = spawn(binary, ["app-server", "--stdio"], { stdio: ["pipe", "pipe", "inherit"] });
const lines = readline.createInterface({ input: child.stdout });
const send = value => child.stdin.write(`${JSON.stringify(value)}\n`);
const timeout = setTimeout(() => { child.kill(); throw new Error(`Codex App Server smoke test timed out: ${JSON.stringify(output)}`); }, 30_000);

lines.on("line", line => {
  const message = JSON.parse(line);
  if (message.id === 1) {
    send({ method: "initialized", params: {} });
    send({ method: "account/rateLimits/read", id: 2 });
    send({ method: "account/usage/read", id: 3 });
    return;
  }
  if (message.id === 2) {
    const result = message.result || {};
    const buckets = result.rateLimitsByLimitId || (result.rateLimits ? { codex: result.rateLimits } : {});
    output.windows = Object.values(buckets).flatMap(bucket => [bucket.primary, bucket.secondary].filter(Boolean)).map(window => ({
      remainingPercent: Math.max(0, 100 - Number(window.usedPercent || 0)), resetsAt: window.resetsAt || null
    }));
  }
  if (message.id === 3) output.usage = message.result || { error: message.error || "empty response" };
  if (!output.windows || output.usage === undefined) return;
  clearTimeout(timeout);
  console.log(JSON.stringify({ connected: true, bucketCount: output.windows.length, ...output }));
  child.kill();
});

const output = {};
send({ method: "initialize", id: 1, params: { clientInfo: { name: "codex_quota_tracker_smoke", title: "Codex Quota Tracker Smoke Test", version: "0.1.9" } } });
