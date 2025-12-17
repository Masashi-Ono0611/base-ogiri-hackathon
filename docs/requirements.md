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
- **Claimant (Grandchild)**: receives the secret out-of-band (paper/handwritten) and later claims the funds.

## 4. User Stories
### 4.1 Deposit (Lock)
- As a depositor, I can input:
  - token amount
  - unlock date/time 
  - secret (user-provided or auto-generated)
- As a depositor, I can approve USDC spending and deposit to the contract.
- As a depositor, I can see:
  - deposit tx hash
  - created lock contract address (if per-lock proxy)
  - lock id
  - secret hash
  - unlock timestamp

### 4.2 Generate PDF (Inheritance Document)
- As a depositor, I can generate a PDF containing a Japanese inheritance letter template with required fields.
- The PDF must include:
  - contract address
  - lock id
  - chain name (Base Sepolia)
  - token contract address (USDC)
  - amount
  - timelock/unlock date
  - hashlock (hash)
- The app should minimize additional inputs on the PDF step.
  - Lock details must be auto-filled from Step 1.
  - Names, signature, and date should be handwritten after printing.
- The PDF should **NOT include the secret** by default.
  - Optionally: include a placeholder line “Secret (to be handwritten): ________”.

### 4.3 Unlock / Claim
- As a claimant, I can input:
  - lock identifier 
    - contract address
    - lock id
  - secret
- As a claimant, I can claim tokens if conditions are met.

## 5. Contract Requirements
### 5.1 Contract Type
Prefer a **single contract** managing multiple locks by `lockId`, to avoid deploying per user.

### 5.2 Data Model (on-chain)
A lock should contain:
- `depositor: address`
- `token: address`
- `amount: uint256`
- `hashlock: bytes32`
- `unlockTime: uint64` (unix timestamp)
- `claimed: bool`

### 5.3 Core Functions (proposed)
- `createLock(token, amount, hashlock, unlockTime) returns (lockId)`
  - Requires ERC20 `transferFrom` from depositor.
- `claim(lockId, secret)`
  - Validates `keccak256(secret) == hashlock` and `block.timestamp >= unlockTime` and not claimed.
  - Transfers tokens to `msg.sender` (any caller who knows the secret).

### 5.4 Hashing
- Secret representation (canonical): `bytes` / `bytes32`.
- Hash: `keccak256(abi.encodePacked(secretBytes))`.
- App must compute hash **exactly** matching contract.

### 5.5 Events
- `LockCreated(lockId, depositor, token, amount, hashlock, unlockTime)`
- `LockClaimed(lockId, claimer)`

### 5.6 Security
- Reentrancy protection on claim.
- Validate `unlockTime` in the future on create.
- Do not store secret on-chain.

## 6. App Requirements (Next.js Base Mini App)
### 6.1 Screens
- **Deposit screen**
  - Inputs: amount, unlock date, secret generation.
  - Output: lockId/txHash.
- **Deposit screen (PDF)**
  - After lock creation, enable a print button for the inheritance document.
  - Lock details are auto-filled from the deposit transaction.
  - Names/signature/date are handwritten after printing.
  - Button: print / save as PDF.
  - Prefer a single primary CTA on the Deposit page that switches from "Approve + Create Lock" to "Print document (PDF)" after lock creation.
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
- Client-side generation preferred to avoid server complexity.
- Initial implementation may use an HTML template + `window.print()` and rely on the browser's "Save as PDF".
- If one-click PDF binary generation becomes necessary later, consider `pdf-lib` with a bundled Japanese font.
- Document structure:
  - Heading
  - Parties (depositor/claimant)
  - Statement of intent
  - Asset details (USDC, amount)
  - Lock details (contract address/lockId, hashlock, timelock)
  - Signature area

## 7. Open Questions (to decide before coding)
- Should claim always transfer to `msg.sender` (current) or should we support an explicit receiver address?
- Exact Japanese legal text template requirements?
- How to represent lock identifier in the PDF (lockId vs contract address)?
  - Use `contract address` + `lockId`.

## 8. Acceptance Criteria
- `pnpm build` passes.
- `trivy repo .` remains at 0 vulnerabilities.
- Deposit → PDF generation → Claim flow works on Base Sepolia for USDC.
