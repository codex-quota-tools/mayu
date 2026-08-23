$ErrorActionPreference = "Stop"

Write-Host "[1/5] Installing locked dependencies"
npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[2/5] Installing the official Codex CLI sidecar"
npm install --no-save @openai/codex@0.146.0-alpha.9 "@openai/codex-win32-x64@npm:@openai/codex@0.146.0-alpha.9-win32-x64"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run sidecar
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[3/5] Running frontend tests"
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[4/5] Building the frontend"
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[5/5] Building Windows NSIS installer"
npm run tauri -- build --target x86_64-pc-windows-msvc --bundles nsis
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Installers are under src-tauri\target\x86_64-pc-windows-msvc\release\bundle"
