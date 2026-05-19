# Sentinel Guardian

An endpoint-monitoring dashboard built on TanStack Start, with a real
data pipeline behind the visuals: server functions, an HTTP ingest API,
and a standalone agent that reports live telemetry from any host you
point at it.

This was originally a static Lovable mock — beautiful UI, every number
hardcoded. This pass adds the wiring.

## Quick start

```bash
bun install
bun dev          # dashboard at http://localhost:3000
```

In a second terminal:

```bash
bun agent/agent.ts   # your machine joins the fleet, tagged "live"
```

## What's real, what's simulated

The brief calls for "monitoring 4,821 devices across smartphones,
servers, IoT…" — that headline number is decorative. What's actually
real:

| Surface                       | Source                                                |
| ----------------------------- | ----------------------------------------------------- |
| Fleet table rows              | Server-side state, polled every 3s                    |
| Threat list                   | Server-side simulation tick injects new events        |
| Intelligence feed             | Simulation tick + agent-derived events                |
| Risk score sparkline          | Rolling 12-bucket window of mean device risk          |
| Packets/sec, blocked/min, etc | Drift-jittered counters                               |
| **`live`-badged devices**     | **Real telemetry from `agent/agent.ts`**              |
| Fleet headline `4,821`        | Static — represents an aspirational fleet size        |
| Privacy & health metrics      | Seeded values that drift; nothing actually scanned    |

Nothing in this build *actually* detects malware, scans webcams,
quarantines processes, or talks to a router. The buttons that say so
are intentionally honest: in `/threats`, the **Quarantine** action does
mark a threat as quarantined on the server, but only in the in-memory
store.

## Architecture

```
┌──────────────────┐    fetch    ┌────────────────────────┐
│  Browser (React) │ ──────────▶ │ TanStack Start server  │
│  TanStack Query  │             │  - server functions    │
│  3s poll         │ ◀────────── │  - /api/ingest         │
└──────────────────┘    JSON     │  - in-memory store     │
                                 │  - 3s simulation tick  │
                                 └──────────┬─────────────┘
                                            │ POST every 5s
                                ┌───────────┴────────────┐
                                │   agent/agent.ts       │
                                │   (Bun, host machine)  │
                                └────────────────────────┘
```

### Server functions (`src/server/`)

- `state.ts` — single in-process store. Holds devices, threats,
  intelligence events, privacy and health metrics. Runs a `setInterval`
  tick every 3s that jitters numeric values, occasionally injects
  threats, ages out old intel, and rolls the risk-history sparkline
  forward.
- `queries.ts` — thin `createServerFn` wrappers exposed to the client.

### Client queries (`src/hooks/queries.ts`)

Each surface uses a TanStack Query hook with `refetchInterval: 3000`
so the UI updates continuously without manual subscriptions or
WebSockets. Mutations (currently just **Quarantine**) invalidate the
relevant query keys.

### Ingest API (`src/routes/api/ingest.ts`)

`POST /api/ingest` with a bearer token. Body:

```json
{ "hostname": "...", "os": "...", "ip": "...", "cpu": 0, "ram": 0, "disk": 0 }
```

cpu/ram/disk are 0–100 percentages. Reports upsert a `Device` row in
the store tagged `source: "agent"`, which is what renders the `live`
badge in the UI.

### Routes (`src/routes/`)

| Path            | Purpose                                          |
| --------------- | ------------------------------------------------ |
| `/`             | Overview: KPIs, attack map, intel feed, top devices |
| `/devices`      | Full fleet table with CPU/RAM/disk, risk, last seen |
| `/threats`      | Threat list with quarantine action               |
| `/logs`         | Full intelligence feed                           |
| `/network`      | Headline counters; deep telemetry not implemented |
| `/ai-assistant` | Placeholder for an LLM copilot                   |
| `/policies`     | Sample policy table                              |

## Deploying to Cloudflare Workers

The Lovable scaffold targets Cloudflare via `@cloudflare/vite-plugin`.
That works for the static and SSR surfaces, but the in-memory store
won't survive across isolates — each Worker invocation may get its own
copy and recycle at any time. Before you point a real fleet at this:

1. Move state into **Durable Objects** (one per shard) or **D1** for
   persistence + concurrency control.
2. Replace the `setInterval` tick with a Durable Object **alarm** or a
   `scheduled` event handler in `wrangler.jsonc`.
3. Pull `SENTINEL_AGENT_TOKEN` from the Workers secret binding instead
   of `process.env`.
4. Front the ingest endpoint with rate limiting (Cloudflare's
   `unsafe-eyeball` or Turnstile is not appropriate here; use a regular
   rate limiter binding).

## What this build is not

Be honest about scope. Compared to a production endpoint protection
platform like CrowdStrike, SentinelOne, or Microsoft Defender for
Endpoint, this is missing:

- Real telemetry collection (process trees, kernel events, syscall
  auditing, ETW, eBPF, etc.). The agent reports three counters.
- Detection logic. There is no malware engine, no behavioural
  analytics, no ML risk model — `risk` is a function of CPU + RAM load.
- Identity & authorisation. There's a shared bearer token. No SSO, no
  roles, no audit trail.
- Persistence. State lives in memory.
- Transport security. Plain HTTP locally; you must terminate TLS
  yourself before deploying anywhere reachable.
- Multi-tenancy, retention, compliance controls.

What it *does* give you is a working end-to-end skeleton: a real agent
talking to a real ingest endpoint, server-side state, polling
queries, and a navigable multi-page UI with the original aesthetic
preserved. From here each missing piece is a focused extension rather
than a from-scratch build.

## Authorisation reminder

Even in development, only run the agent on machines you own or have
explicit permission to monitor. The brief at the top of this project
says it and it's worth repeating: monitoring software pointed at
devices without consent is wrong and frequently illegal regardless of
how good the intentions are.
