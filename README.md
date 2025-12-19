# MagoHODL

MagoHODL is a Base Mini App that locks crypto "for generations".

It uses an HTLC-style **hashlock + timelock** contract to lock ERC20 tokens so they cannot be sold until a specified unlock time. At deposit time, the recipient wallet does not need to be specified; the eventual claimant uses a secret to claim after the timelock.

## What this repo contains

- **Mini App (Next.js App Router)** for deposit + claim.
- **Smart contracts (Hardhat)** for the lock/claim flow.
- **Inheritance document viewer** (HTML-based) for printing/saving.

## Network / Token

- **Chain**: Base Mainnet (chainId: 8453)
- **Token**: cbBTC

The current on-chain addresses used by the app are defined here:

- `app/constants/onchain.ts`

## Local development

Install dependencies:

```bash
pnpm install
```

Run dev server:

```bash
pnpm dev
```

## Environment variables

Copy the example file and fill values locally:

```bash
cp .example.env .env
```

Common variables:

- `NEXT_PUBLIC_URL`
- `NEXT_PUBLIC_PROJECT_NAME`
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY`

Hardhat variables:

- `BASE_RPC_URL`
- `DEPLOYER_PRIVATE_KEY`
- `BASESCAN_API_KEY` (optional, for verification)

## Contract development

Compile / test:

```bash
pnpm hh:compile
pnpm hh:test
```

Deploy to Base Mainnet:

```bash
pnpm hh:deploy:base
```

For details, see:

- `docs/contract-development.md`

## Inheritance document (PDF)

The app renders a printable document as HTML.

In the Base app, `window.print()` may be restricted. The current UX opens a dedicated viewer page in the in-app browser.

## Security: front-running resistance

Claim is implemented as a **commit → reveal** flow to reduce the risk of mempool observers copying a reveal transaction.

For the full threat model and the commitment design, see:

- `docs/front-running-and-commit-reveal.md`

## Product requirements

The product scope and requirements are documented here:

- `docs/requirements.md`

## Japanese summary

- `SUBMIT.md`

---
