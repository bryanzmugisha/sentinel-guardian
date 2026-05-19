# Sentinel Guardian Host Agent

A single-file Bun script that reports real CPU, RAM and disk utilisation
from the machine it runs on to the dashboard's `/api/ingest` endpoint.
The reported device shows up in the fleet table tagged **live** to
distinguish it from the simulated entries.

## Run

```bash
# in one terminal: start the dashboard
bun dev

# in another: start the agent
bun agent/agent.ts
```

Within a few seconds you should see your machine appear in the Devices
table with a `live` badge.

## Configuration

All optional, set via environment variables:

| Variable             | Default                 | Meaning                                   |
| -------------------- | ----------------------- | ----------------------------------------- |
| `SENTINEL_URL`       | `http://localhost:3000` | Where to POST telemetry                   |
| `SENTINEL_TOKEN`     | `dev-token`             | Shared bearer token; must match server    |
| `SENTINEL_INTERVAL`  | `5000`                  | Milliseconds between samples              |

The server-side default is also `dev-token`. To use a real token, set
`SENTINEL_AGENT_TOKEN` in the dashboard's environment and the matching
`SENTINEL_TOKEN` on the agent.

## What it actually measures

- **CPU**: delta of `os.cpus()` idle/total times between samples — the
  same calculation tools like `top` use.
- **RAM**: `(totalmem - freemem) / totalmem`. Note that on Linux this
  counts buffer/cache as "used", which overstates real memory pressure.
  For a more accurate figure parse `/proc/meminfo` `MemAvailable`.
- **Disk**: `df -P /` on Unix, PowerShell on Windows. Falls back to 0
  if the platform call fails.
- **OS label**: parsed from `/etc/os-release` on Linux, otherwise the
  Node platform string + release.

## Cross-platform notes

- macOS and Linux: works out of the box.
- Windows: needs PowerShell available on PATH for disk readings; CPU
  and RAM work without it.
- Linux containers without `df` available: disk reads as 0; everything
  else works.

## Security caveats (don't deploy as-is)

- The transport is plain HTTP with a shared bearer token. Real
  deployments need TLS and per-agent identities (client certs, mTLS,
  signed device tokens, or short-lived JWTs from an enrolment flow).
- There is no replay protection, no rate limit, and no request
  signature. A leaked token equals full ingest access.
- The server trusts the hostname the agent claims. A real fleet should
  bind tokens to specific device IDs at enrolment.

This agent is intended for development and demonstration. Hardening the
ingest path is one of the first things to do before pointing it at
production endpoints.
