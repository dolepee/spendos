# SpendOS

Agent wallet governance for the Open Wallet Standard. Give agents wallets, not blank checks.

**Live Dashboard:** https://spendos-ten.vercel.app

## What It Does

SpendOS adds two missing layers to OWS:

1. **Guardian Recovery** (Rust crate) -- Shamir secret sharing, time-locked recovery, dead man's switch with heartbeat monitoring. If an agent wallet owner goes offline, guardians can reconstruct the secret after a configurable time lock.

2. **Spend Governance Dashboard** (Next.js) -- Manage agent spending limits, API keys, chain restrictions, and transaction policies. Monitor activity in real time. Pause or revoke agents instantly.

```
┌─────────────┐      ┌──────────────┐      ┌─────────┐
│  AI Agent   │ ──── │   SpendOS    │ ──── │   OWS   │
│             │      │  Governance  │      │ Wallet  │
└─────────────┘      └──────────────┘      └─────────┘
                      • Guardian Recovery (Rust)
                      • Spend Limits & Policies
                      • API Key Management
                      • Dead Man's Switch
```

## Guardian Crate (`guardian/`)

Social recovery and dead man's switch for OWS wallets. Builds against OWS core v1.2.4.

### Features

- **Shamir Secret Sharing** -- configurable threshold (e.g. 3-of-5)
- **Guardian setup** with encrypted shard storage (AES-256-GCM via ows-signer)
- **Time-locked recovery** -- initiate, submit shards, complete or cancel
- **Freeze mechanism** -- any guardian with freeze permission can halt a suspicious recovery
- **Dead man's switch** -- heartbeat monitoring with configurable inactivity trigger and beneficiaries

### Build and Test

```bash
# Build
cargo build --package ows-guardian

# Run tests (7/7 passing)
cargo test --package ows-guardian --features fast-kdf
```

### Architecture

```
guardian/src/
  shamir.rs          # Shamir secret splitting and reconstruction
  setup.rs           # Guardian configuration and shard encryption
  recovery.rs        # Recovery flow: initiate, submit, complete, cancel, freeze
  heartbeat.rs       # Dead man's switch and heartbeat recording
  guardian_store.rs   # Persistent guardian config storage
  recovery_store.rs   # Recovery request state storage
  types.rs           # GuardianConfig, RecoveryRequest, Beneficiary, etc.
  error.rs           # GuardianError type
```

## Dashboard (`app/`)

Agent wallet governance with institutional UI.

### Features

- **Spending limits** -- daily/monthly caps per agent with visual progress bars
- **Chain restrictions** -- control which chains each agent can transact on
- **API key management** -- generate, rotate, and revoke agent API keys
- **Real-time activity feed** -- transaction monitoring with OWS verification
- **Policy enforcement** -- pause, resume, or revoke agents instantly

### Run Locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Tech Stack

| Layer | Stack |
|-------|-------|
| Guardian crate | Rust, Shamir (sharks), AES-256-GCM, scrypt, chrono |
| Dashboard | Next.js 16, TypeScript, Tailwind CSS, Framer Motion, Prisma |
| OWS integration | ows-core, ows-signer (git dependency) |

## Project Structure

```
spendos/
  guardian/           # ows-guardian Rust crate
    Cargo.toml
    src/
  app/                # Next.js dashboard
    page.tsx
    layout.tsx
    globals.css
  lib/                # Dashboard utilities
  prisma/             # Database schema
  Cargo.toml          # Workspace root
```

## License

MIT
