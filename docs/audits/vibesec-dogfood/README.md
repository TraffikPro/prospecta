# VibeSec dogfooding evidence (Prospecta)

Local OBSERVE dry-run against this integration branch (`origin/main` base).

| Field | Value |
| --- | --- |
| VibeSec version | `1.1.1` |
| Commit | `68f088c0694b193425b7258eaab053eec55cc43e` |
| Tag | `v1.1.1` |
| Command | `node dist/cli/main.js scan <target> --format json` |
| Exit code | `1` (findings) |
| Findings | `59` |
| Duration | ~2s (local Windows) |

See `findings-triage.md` for classification. See `scan-meta.json` for machine metadata.
The JSON report is retained for CI dogfooding comparison; secret material is redacted by VibeSec.
