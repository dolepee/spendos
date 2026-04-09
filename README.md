# SpendOS

Agent wallet governance for the Open Wallet Standard. Give agents wallets, not blank checks.

**Demo Dashboard:** https://spendos-ten.vercel.app

## What It Does

SpendOS adds two missing layers to OWS:

1. **Guardian Recovery** (Rust crate) -- Shamir secret sharing, guardian-authenticated recovery, time-locked completion, and dead man's switch with heartbeat monitoring. If an agent wallet owner goes offline, guardians can reconstruct the secret after a configurable time lock.

2. **Spend Governance Dashboard** (Next.js prototype) -- Institutional UI for agent spending limits, chain restrictions, and governance workflows. The current dashboard is a mocked product surface, not a live policy backend.

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
- **Guardian-authenticated recovery** -- initiate and cancel only with guardian proof
- **Time-locked completion** -- submitted recovery proofs are persisted without storing plaintext shard material on disk
- **Freeze mechanism** -- any guardian with freeze permission can halt a suspicious recovery
- **Dead man's switch** -- heartbeat monitoring with configurable inactivity trigger and beneficiaries

### Build and Test

```bash
# Build
cargo build --package ows-guardian

# Run tests
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

Agent wallet governance prototype with institutional UI.

### Features

- **Spending limits** -- daily/monthly caps per agent with visual progress bars
- **Chain restrictions** -- control which chains each agent can transact on
- **Prototype API key UX** -- browser-generated demo keys for showing the management flow
- **Activity feed prototype** -- mocked transaction stream for UI demonstration
- **Governance prototype** -- product surface for pause / revoke concepts, not live enforcement

### Important note

The Rust guardian crate is the real security component in this repo. The Next.js dashboard is currently a product prototype backed by mocked data so the UI does not overclaim live policy enforcement or real OWS-signed activity.

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
