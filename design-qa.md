# Design QA

## Target

- Reference: the user-provided CodexMeter popover screenshot.
- Implementation viewport: 390 x 400 px.
- Primary state: Codex weekly quota at 39%, settings collapsed, no WorkBuddy record yet.

## Visual comparison

The latest annotated reference and the rendered implementation were placed side by side in one 780 x 400 comparison image. The implementation removes the separate top refresh row, places refresh inside the quota card beside the update timestamp, and removes the WorkBuddy official-usage link. The resulting panel begins immediately with the quota card and is visibly shorter.

## Interaction checks

- Settings expands and exposes menu bar text, launch, notifications, and WorkBuddy threshold controls.
- WorkBuddy record action opens the editor modal; cancel closes it.
- Refresh has a visible loading state.
- The in-card refresh control is clickable and enters its spinning loading state.
- No browser console warnings or errors were observed in the tested flow.

## Issues resolved

- P1: oversized 800 x 820 window replaced with a fixed 390 x 600 tray popover.
- P1: generic application icon replaced with an attributed app icon and wired into macOS and Windows bundle metadata.
- P1: macOS Dock presence removed through accessory activation policy; first launch now lives in the menu bar.
- P1: menu bar click now positions the panel directly beneath the clicked status item and clamps it to the active display.
- P2: default status item label changed to `Codex 额度` while retaining the live percentage.
- P1: default popover height reduced from 600 px to 400 px; the main quota card now places the large percentage on the left and reset figures on the right.
- P2: the quota progress bar now animates from left to right when fresh data renders, with reduced-motion support preserved.
- P2: persistent settings expanded state replaced by a compact collapsed row.
- P1: version 0.1.3 moves refresh into the Codex quota card and removes the WorkBuddy official-usage link and its stale styling.
- P1: Windows now receives an explicit tray icon, a customized hover tooltip with live quota, and a repeatable PowerShell NSIS/MSI build script.
- P1: version 0.1.4 labels the quota reset row as Beijing time and formats it with the fixed `Asia/Shanghai` timezone on every computer.
- P2: version 0.1.4 replaces the app icon with an original segmented quota gauge that is visually distinct from the OpenAI logo.
- P1: version 0.1.5 adds a compact profile view with the five official account-usage summaries and a 12-week Token heatmap.
- P1: the reference profile screenshot and the rendered 390 x 400 implementation were reviewed side by side; the desktop reference hierarchy is retained while adapting it to the tray-sized panel.
- P2: the profile display name is editable and local; the UI clearly labels account statistics as official synchronization and does not fabricate unsupported plugin metrics.
- P1: the profile entry, close control, and manual synchronization control were verified as unique clickable buttons in the browser preview.
- P1: version 0.1.6 opens directly on the personal profile and resets to that view whenever the tray panel is reopened; the quota view remains reachable through “返回额度”.
- P1: version 0.1.7 keeps quota, WorkBuddy, settings, and the footer in place, then renders the expanded profile content directly below them in the same scrollable panel.

final result: passed
