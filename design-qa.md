# Design QA

## Target

- Reference: the user-provided `DESIGN.md` midnight precision-instrument direction, adapted for a quota utility rather than copied from Linear.
- Implementation viewport: 390 x 590 px.
- Primary state: Codex weekly quota at 39%, settings collapsed, no WorkBuddy record yet.

## Visual comparison

The rendered implementation uses a near-black canvas, 0.5 px structural borders, low-weight typography and a single acid-lime signal rail. The quota card remains the only dominant surface; WorkBuddy and profile data deliberately recede. The default expanded profile and footer fit inside a 390 x 590 tray panel, while the settings state stays scrollable without displaying a scrollbar.

## Interaction checks

- Settings expands and exposes menu bar text, launch, notifications, and WorkBuddy threshold controls.
- WorkBuddy record action opens the editor modal; cancel closes it.
- Refresh has a visible loading state.
- The in-card refresh control is clickable and enters its spinning loading state.
- No browser console warnings or errors were observed in the tested flow.
- Dark and light themes were both rendered at the target width and checked for overflow, contrast, focus states and information hierarchy.

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
- P1: the precision-instrument redesign replaces translucent Apple-style cards and decorative gradients with compact 12 px surfaces, hairline borders and low-weight Inter-compatible typography.
- P2: the progress rail keeps a continuous scan animation, respects reduced-motion preferences and remains the only strong chromatic signal in the normal state.
- P1: the fixed desktop panel now opens at 390 x 590 so the default-expanded profile is visible without recreating the earlier oversized window.
- P1: version 0.1.8 uses the same longest-window selection in the tray title and panel headline, preventing conflicting percentages.
- P2: a second official quota window is rendered as one quiet companion row with its own percentage and countdown; the main percentage remains the only dominant number.
- P1: manual refresh now ends after 15 seconds and surfaces a compact retry message instead of spinning indefinitely.
- P1: version 0.1.9 distinguishes connected, reconnecting, incompatible and offline states; stale official values remain visible but are explicitly labeled as last-known data.
- P1: device login and native refresh commands now fail recoverably after 20 seconds rather than leaving an indefinite pending state.
- P1: WorkBuddy manual records validate non-negative values and reject totals below the remaining balance with an inline alert while preserving the editor.
- P1: the updated default-expanded profile and validation flow were visually verified at the 390 x 590 tray-panel viewport.

final result: passed
