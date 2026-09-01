# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [Unreleased]

## [0.1.9] - 2026-09-01

### Added

- Public-project documentation, privacy policy, security policy, contribution templates and portable-source handoff guidance.
- Inline validation and recoverable error messages for WorkBuddy manual records and settings.
- Explicit offline, reconnecting and incompatible connection states while retaining last known official data.

### Fixed

- Bound Codex refresh and device-login requests to 20 seconds so a stalled helper cannot leave the panel waiting forever.
- Keep first-login, retry and save controls responsive after native command failures.

## [0.1.8] - 2026-08-25

### Added

- Compact secondary quota-window status with reset countdown.
- Visible retry guidance when a manual refresh fails or times out.

### Fixed

- Keep the menu bar percentage consistent with the longest quota window shown in the panel.
- Stop manual refresh after 15 seconds instead of leaving the interface spinning indefinitely.
- Restore CSS side-effect import typing for compatibility with newer TypeScript releases.

## [0.1.7] - 2026-08-09

### Added

- macOS menu bar and Windows system tray quota panel.
- Codex quota, Beijing reset time and account activity display.
- Local WorkBuddy points recording, themes, notifications and autostart.
- Cross-platform GitHub Actions installer builds.
