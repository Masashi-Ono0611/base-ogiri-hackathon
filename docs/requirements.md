# Base Mini App — Token Inheritance (HTLC Timelock)

## 1. Goal
Build a Base Mini App that enables a “grandchild token inheritance” flow using a **Hashlock + Timelock** contract.

- Chain: **Base Mainnet**
- Token (initial): **cbBTC** `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf`
- Core idea: The depositor locks ERC20 funds into a contract.
  - A **secret hash** is stored on-chain.
  - A **timelock (unlock after time)** is stored on-chain.
  - Unlock requires:
    - correct secret (preimage matches hash)
    - timelock has passed

## 2. Non-goals (initial scope)
- Multi-chain support
- Multi-token UI (beyond cbBTC)
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
- As a depositor, I can approve cbBTC spending and deposit to the contract.
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
  - chain name (Base)
  - token contract address (cbBTC)
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
- As a claimant, I can claim tokens if conditions are met, using a **commit-reveal** flow:
  - First, I submit a commit transaction that does **not** reveal the secret.
  - After a minimum delay, I submit a reveal transaction that provides the secret.
  - This flow must be resilient to mempool observers (front-running resistance).

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

Commit-reveal (per lock) state should contain:
- `commitment: bytes32` (single active commitment for the lock)
- `committer: address` (who committed)
- `commitBlock: uint64` (block number when committed)
- `MIN_COMMIT_DELAY_BLOCKS: uint64` (contract constant)

### 5.3 Core Functions (proposed)
- `createLock(token, amount, hashlock, unlockTime) returns (lockId)`
  - Requires ERC20 `transferFrom` from depositor.
- `commit(lockId, commitment)`
  - Stores a single active commitment for the lock.
  - Must revert if the lock is already claimed.
  - Must revert if a commitment is already set (or must define a safe overwrite rule).
- `revealAndClaim(lockId, secret, salt)`
  - Validates:
    - `keccak256(secret) == hashlock`
    - `block.timestamp >= unlockTime`
    - not claimed
    - `keccak256(abi.encodePacked(lockId, msg.sender, secret, salt)) == commitment`
    - `block.number >= commitBlock + MIN_COMMIT_DELAY_BLOCKS`
  - Transfers tokens to `msg.sender`.

Notes:
- The contract must not require specifying the claimant wallet at lock time.
- The contract must remain safe against mempool observers attempting to front-run the reveal.

### 5.4 Hashing
- Secret representation (canonical): `bytes` / `bytes32`.
- Hash: `keccak256(abi.encodePacked(secretBytes))`.
- App must compute hash **exactly** matching contract.

Commitment hashing (canonical):
- `commitment = keccak256(abi.encodePacked(lockId, committer, secretBytes, saltBytes))`
- `committer` is `msg.sender` at reveal time.
- `saltBytes` must be sufficiently random.

### 5.5 Events
- `LockCreated(lockId, depositor, token, amount, hashlock, unlockTime)`
- `LockCommitted(lockId, committer, commitment, commitBlock)`
- `LockClaimed(lockId, claimer)`

### 5.6 Security
- Reentrancy protection on claim.
- Validate `unlockTime` in the future on create.
- Do not store secret on-chain.

Front-running resistance requirements:
- The secret must not appear on-chain until `revealAndClaim`.
- A mempool observer who learns the secret from a pending `revealAndClaim` transaction must not be able to steal the claim.
- This must be enforced by binding reveal to a prior on-chain commitment from the same `msg.sender`, and enforcing a minimum delay.

Operational requirement:
- The app UX must ensure the commitment transaction is confirmed before sending `revealAndClaim`.

## 6. App Requirements (Next.js Base Mini App)
### 6.1 Screens
- **Deposit screen**
  - Inputs: amount, unlock date, secret generation.
  - Output: lockId/txHash.
- **Deposit screen (PDF)**
  - After lock creation, enable a print button for the inheritance document.
  - Lock details are auto-filled from the deposit transaction.
  - Names/signature/date are handwritten after printing.
  - Button: open a dedicated viewer page in the in-app browser.
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
- In Base app, `window.print()` may be restricted; prefer opening a dedicated viewer page via MiniKit `openUrl()`.
- If one-click PDF binary generation becomes necessary later, consider `pdf-lib` with a bundled Japanese font.
- Document structure:
  - Heading
  - Parties (depositor/claimant)
  - Statement of intent
  - Asset details (cbBTC, amount)
  - Lock details (contract address/lockId, hashlock, timelock)
  - Signature area

## 7. Open Questions (to decide before coding)
- Exact Japanese legal text template requirements?
- How to represent lock identifier in the PDF (lockId vs contract address)?
  - Use `contract address` + `lockId`.

- Commit overwrite policy:
  - Should `commit(lockId, ...)` be one-time only (recommended)?
  - Or should it be overwriteable under strict rules?
- UX:
  - How many confirmations are required before allowing `revealAndClaim`?
  - How many blocks should `MIN_COMMIT_DELAY_BLOCKS` be?
- Transfer target:
  - Should claim always transfer to `msg.sender`?
  - Or should we support an explicit receiver address?

## 8. Acceptance Criteria
- `pnpm build` passes.
- `trivy repo .` remains at 0 vulnerabilities.
- Deposit → PDF viewer → Claim flow works on Base Mainnet for cbBTC.
