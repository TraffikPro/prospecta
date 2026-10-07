# VibeSec dogfooding evidence (Prospecta)

Historical OBSERVE dry-run used to validate CI integration before merge.

| Field | Value |
| --- | --- |
| Status | Merged to `main` via [PR #84](https://github.com/TraffikPro/prospecta/pull/84) |
| CI job | `VibeSec scan (observe)` in `.github/workflows/security.yml` |
| Ops doc | [`docs/development/ci-security-gates.md`](../../development/ci-security-gates.md) |
| VibeSec version | `1.1.1` |
| Commit | `68f088c0694b193425b7258eaab053eec55cc43e` |
| Tag | `v1.1.1` |
| Command | `node dist/cli/main.js scan <target> --format json` |
| Exit code | `1` (findings) |
| Findings | `59` |
| Files scanned | `485` (35 skipped) |
| Duration | ~2s (local Windows) |

See `findings-triage.md` for classification. See `scan-meta.json` for machine metadata.
The JSON report is retained for CI dogfooding comparison; secret material is redacted by VibeSec.

Findings remain OBSERVE-only: they do not block merge. Scanner infrastructure
failures (install/build/parse/timeout/exit `2`) still fail the job.
