# Changelog

All notable changes to HoneyMoney. Versions follow [Semantic Versioning](https://semver.org).

## [Unreleased]

### Added
- Agents trained with professional playbooks for research, offer design, copywriting, calls to action and conversion design (prompts v2).
- New sales page sections: highlight, before/after comparison, how it works, about the creator; richer hero (label, highlights, reassurance line), price card with everything included, guarantee seal.
- Redesigned sales pages: four styles (light, bold, elegant, dark), nine colours, three heading typefaces, sticky buy bar on phones.
- "Plano em PDF": the whole offer (audience, product outline, copy, e-mails, ads, next steps) as a printable A4 document.
- Free instance models through Groq, OpenRouter or any OpenAI-compatible host, and fallback models when the main one is overloaded.

- Five more page templates (Vibrante, Minimalista, Luxo, Revista, Divertido), ten more colours (19 in total) and six more heading fonts (9 in total).
- Editor: one-click template gallery and visual pickers for template, colour and font.

### Security
- Generation limits are counted on a usage ledger that users cannot delete (deleting projects no longer resets the free-model daily limit), and the worker reserves every model call atomically before making it, including page reviews.
- Content-Security-Policy and Cross-Origin-Opener-Policy on the whole app (published pages keep their stricter nonce-based policy).
- Deleting an account asks for the password again.
- `is_admin()` moved out of the public Data API; at most 200 projects per account.
- Dependencies: Electron 44, electron-builder 26.18, Vitest 4, AI SDK patched; overrides for undici, OpenTelemetry, glob, minimatch and tar. `pnpm audit --prod` reports no known vulnerabilities.

### Changed
- Model calls use the provider's JSON mode and show the model an example of the expected answer, so small free models keep the format.

## [0.1.0] — 2026-11-09

First release (Phase 1 / MVP). See the [release notes](docs/releases/v0.1.0.md).

### Added
- Web app: accounts, AI keys in Vault, briefing, six agents with Sentinel review, animated 2D office, projects with versions, block page editor and publishing, LGPD export/deletion.
- Installable PWA (desktop and mobile browsers) with an offline screen.
- Desktop app for Windows, macOS and Linux (Electron) and Android app (Capacitor), both connecting to a HoneyMoney server chosen on first launch.
- Release workflow that builds installers and publishes GitHub Releases from version tags.
