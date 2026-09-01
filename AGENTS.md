# Codex project instructions

This repository is the source for 码余 (Mayu), an unofficial local-first Codex quota tracker for macOS and Windows.

## Before changing code

- Read `README.md`, `docs/DEVELOPMENT.md`, `docs/PRIVACY.md`, and `docs/CODEX_HANDOFF.md`.
- Inspect the working tree before editing and preserve unrelated user changes.
- Keep the React/TypeScript frontend and Tauri/Rust desktop behavior consistent.

## Privacy and data boundaries

- Never add, read, log, package, or commit API keys, tokens, cookies, Codex login files, `data.json`, databases, certificates, or personal account output.
- Codex quota data must come from the local Codex CLI App Server. Fail visibly when it cannot be read; do not invent fallback quota values.
- WorkBuddy points remain manual until a documented public balance interface exists. Do not extract local credentials or call undocumented endpoints.
- Keep user settings local. Do not add a project backend, analytics, telemetry, or cloud account without explicit user approval.

## Generated files

- Do not commit `node_modules/`, `dist/`, `src-tauri/target/`, `src-tauri/binaries/`, installers, archives, logs, or local data.
- Recreate the Codex sidecar with `npm run sidecar` on the target platform.
- Do not treat browser-only preview as validation of tray, notifications, autostart, sidecar, or Rust commands.

## Required verification

Run the relevant checks before handoff:

```bash
npm run build
npm test
cargo test --manifest-path src-tauri/Cargo.toml
```

Run `node scripts/smoke-codex.mjs` only for local real-account validation. Do not publish its output. Cross-platform releases must be rebuilt on the matching operating system or through GitHub Actions, then checked for format, integrity, and SHA-256.
