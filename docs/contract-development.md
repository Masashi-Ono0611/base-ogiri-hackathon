# Contract Development (Hardhat) — Base Sepolia

This repository includes a minimal Hardhat setup for Base Sepolia contract development.

## Prerequisites
- Node.js: use a **Hardhat-supported** version (current version: **22 LTS**).
- pnpm

## Environment Variables
Copy the example file and fill values locally.

```bash
cp .example.env .env
```

Required variables for deployment:
- `BASE_SEPOLIA_RPC_URL` — Base Sepolia RPC endpoint
- `DEPLOYER_PRIVATE_KEY` — private key for deployment account (DO NOT commit)

Notes:
- `.env` files are gitignored.
- Never commit private keys.

## Commands
### Compile
```bash
pnpm hh:compile
```

### Test
```bash
pnpm hh:test
```

### Deploy to Base Sepolia
```bash
pnpm hh:deploy:base-sepolia
```

Deployment script:
- `scripts/deploy.ts`

## Contracts
- `contracts/InheritanceHTLCTimelock.sol`
  - ERC20 lock with hashlock + timelock
  - `createLock()` deposits tokens into the contract
  - `claim()` requires correct secret + timelock passed

## Common Issues
- **Hardhat warns about unsupported Node versions**: switch to Node 20/22.

## Base Sepolia References
- Chain name: Base Sepolia
- Token (initial target): USDC `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
