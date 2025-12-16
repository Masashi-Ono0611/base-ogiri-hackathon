# Base Mini App — Token Inheritance (HTLC Timelock)

## 1. Goal
Build a Base Mini App that enables a “grandchild token inheritance” flow using a **Hashlock + Timelock** contract.

- Chain: **Base Sepolia**
- Token (initial): **USDC** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Core idea: The depositor locks ERC20 funds into a contract.
  - A **secret hash** is stored on-chain.
  - A **timelock (unlock after time)** is stored on-chain.
  - Unlock requires:
    - correct secret (preimage matches hash)
    - timelock has passed

## 2. Non-goals (initial scope)
- Multi-chain support
- Multi-token UI (beyond USDC)
- Legal advice or guaranteeing legal validity in all jurisdictions
- Custody or key recovery

## 3. Actors / Personas
- **Depositor (Grandparent)**: locks tokens and creates the “inheritance document” PDF.
- **Beneficiary (Grandchild)**: receives the secret out-of-band (paper/handwritten) and later unlocks.

## 4. User Stories
### 4.1 Deposit (Lock)
- As a depositor, I can input:
  - beneficiary name and relationship
  - depositor name and address
  - token amount
  - unlock date/time (or “N days from now”)
  - secret (generated or user-provided)
- As a depositor, I can approve USDC spending and deposit to the contract.
- As a depositor, I can see:
  - deposit tx hash
  - created lock contract address (if per-lock proxy) or lock id (if single contract)
  - secret hash
  - unlock timestamp

### 4.2 Generate PDF (Inheritance Document)
- As a depositor, I can generate a PDF containing a Japanese inheritance letter template with required fields.
- The PDF must include:
  - contract address (or lock id)
  - chain name (Base Sepolia)
  - token contract address (USDC)
  - amount
  - timelock/unlock date
  - hashlock (hash)
- The PDF should **NOT include the secret** by default.
  - Optionally: include a placeholder line “Secret (to be handwritten): ________”.

### 4.3 Unlock / Claim
- As a beneficiary, I can input:
  - lock identifier (contract address or lock id)
  - secret
- As a beneficiary, I can claim tokens if conditions are met.

## 5. Contract Requirements
### 5.1 Contract Type
Prefer a **single contract** managing multiple locks by `lockId`, to avoid deploying per user.

### 5.2 Data Model (on-chain)
A lock should contain:
- `depositor: address`
- `beneficiary: address` (optional in v1 if unknown; but recommended)
- `token: address`
- `amount: uint256`
- `hashlock: bytes32`
- `unlockTime: uint64` (unix timestamp)
- `claimed: bool`

### 5.3 Core Functions (proposed)
- `createLock(token, beneficiary, amount, hashlock, unlockTime) returns (lockId)`
  - Requires ERC20 `transferFrom` from depositor.
- `claim(lockId, secret)`
  - Validates `keccak256(secret) == hashlock` and `block.timestamp >= unlockTime` and not claimed.
  - Transfers tokens to beneficiary.
- `refund(lockId)` (optional for v1)
  - If beneficiary never claims, depositor can reclaim after a long timeout.
  - Not required unless requested.

### 5.4 Hashing
- Secret representation (canonical): `bytes` / `bytes32`.
- Hash: `keccak256(abi.encodePacked(secretBytes))`.
- App must compute hash **exactly** matching contract.

### 5.5 Events
- `LockCreated(lockId, depositor, beneficiary, token, amount, hashlock, unlockTime)`
- `LockClaimed(lockId, beneficiary)`

### 5.6 Security
- Reentrancy protection on claim.
- Validate `unlockTime` in the future on create.
- Do not store secret on-chain.

## 6. App Requirements (Next.js Base Mini App)
### 6.1 Screens
- **Deposit screen**
  - Inputs: beneficiary address, amount, unlock date, secret generation.
  - Output: lockId/txHash.
- **PDF screen**
  - Form fields for Japanese letter template.
  - Button: generate/download PDF.
- **Claim screen**
  - Inputs: lockId, secret.
  - Button: claim.

### 6.2 Data Flow
- Use `wagmi` + `viem` for contract interactions.
- Keep all user inputs in client state; persist only where needed.
- No mocked data in prod/dev.

### 6.3 Environment Variables
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY`
- `NEXT_PUBLIC_URL`
- `NEXT_PUBLIC_PROJECT_NAME`

### 6.4 PDF Generation
- Client-side generation preferred (e.g. `pdf-lib`) to avoid server complexity.
- Document structure:
  - Heading
  - Parties (depositor/beneficiary)
  - Statement of intent
  - Asset details (USDC, amount)
  - Lock details (contract address/lockId, hashlock, timelock)
  - Signature area

## 7. Open Questions (to decide before coding)
- Should beneficiary address be mandatory at deposit time?
- Do we need refund functionality?
- Exact Japanese legal text template requirements?
- How to represent lock identifier in the PDF (lockId vs contract address)?

## 8. Acceptance Criteria
- `pnpm build` passes.
- `trivy repo .` remains at 0 vulnerabilities.
- Deposit → PDF generation → Claim flow works on Base Sepolia for USDC.
