# AGENTS

This repository contains Korean UI text. Encoding safety is mandatory.

## Non-negotiable rules

1. Always keep text files as UTF-8.
2. Never rewrite files through shell commands that do not explicitly set UTF-8.
3. Prefer `apply_patch` for edits.
4. After any text edit, run `npm run check:text` and fix all failures.

## Required verification

- `npm run check:text`
- `npx tsc --noEmit` for TypeScript changes

## Notes for automation agents

- If you inspect files with PowerShell, use `Get-Content -Encoding utf8`.
- Do not mass-reencode files unless explicitly requested.
