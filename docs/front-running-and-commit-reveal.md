# Front-running resistance: Commit-Reveal claim flow

This document explains why the commit-reveal claim flow provides resistance against mempool observers (front-running) while keeping the claimant wallet unspecified at lock creation time.

## 1. Background
In a simple HTLC claim function like `claim(lockId, secret)`, the secret (preimage) must be sent as transaction input. On public mempools, observers can read pending transaction input data before it is included in a block.

If the contract transfers funds to `msg.sender`, any party who learns the secret from the mempool can submit their own transaction with a higher fee and steal the claim.

## 2. Threat model
Assumptions:
- The attacker can observe the public mempool.
- The attacker can submit competing transactions and pay higher priority fees.
- The attacker does NOT have access to the claimant’s private key.
- The attacker does NOT know the secret before it appears in the mempool.

Non-goals:
- Protecting against an attacker who already knows the secret (out-of-band secret leakage).
- Protecting against compromised wallets or key theft.

## 3. Commit-reveal overview
The claim flow is split into two steps:

1) Commit
- The claimant submits `commit(lockId, commitment)`.
- The commitment is a hash that binds the future reveal to:
  - the specific lock (`lockId`)
  - the future claimer (`msg.sender`)
  - the secret
  - a random salt

2) Reveal + Claim
- After a minimum delay (in blocks), the claimant submits `revealAndClaim(lockId, secret, salt)`.
- The contract verifies:
  - the secret matches the hashlock (`keccak256(secret) == hashlock`)
  - the revealer previously committed (`commitment` exists for this lock)
  - the commitment matches the revealer (`msg.sender` is bound)
  - a minimum delay has elapsed

## 4. Canonical commitment
Recommended canonical commitment:

- `commitment = keccak256(abi.encodePacked(lockId, committer, secretBytes, saltBytes))`
- `committer` must be `msg.sender` at reveal time.
- `saltBytes` must be sufficiently random.

## 5. Attack scenarios

### 5.1 Scenario A: Copying a pending reveal transaction
Attacker behavior:
- Observes a pending `revealAndClaim(lockId, secret, salt)` transaction.
- Copies the same input data.
- Submits a competing transaction with higher priority fees.

Why it fails:
- The attacker’s `msg.sender` differs from the original claimant.
- The commitment check binds `msg.sender`:
  - `keccak256(lockId, attacker, secret, salt) != storedCommitment`
- The attacker cannot forge a different `(secret, salt)` that both:
  - matches the on-chain `hashlock` and
  - matches the stored commitment for the attacker.

Result:
- Attacker transaction reverts.

### 5.2 Scenario B: Observing reveal, then committing and waiting
Attacker behavior:
- Observes a pending reveal transaction and learns `secret`.
- Submits `commit(lockId, commitment(attacker,...))` immediately.
- Waits `MIN_COMMIT_DELAY_BLOCKS` and attempts `revealAndClaim`.

Why it does not steal:
- The original claimant is only supposed to reveal after their commit is already confirmed and the delay has elapsed.
- By the time the attacker completes their delay, the lock should already be claimed by the original claimant.

Important operational requirement:
- The app must enforce:
  - commit transaction is confirmed, and
  - the minimum delay has elapsed,
  before it allows the user to submit `revealAndClaim`.

Result:
- Attacker can commit, but cannot beat a correctly executed claim flow.

### 5.3 Scenario C: Front-running the commit transaction
Attacker behavior:
- Observes the pending `commit(lockId, commitment)` transaction.
- Attempts to submit an identical commitment with higher fees.

Why it fails (with correct commitment design):
- The attacker cannot compute the same commitment without knowing `(secret, salt)`.
- The salt must be random and not guessable.
- If the commitment includes `committer`, even an identical `(secret, salt)` would not be reusable across senders.

Notes:
- If a commitment were defined as `keccak256(secret)` only, this attack could become feasible.

Result:
- Attacker cannot steal the commitment.

## 6. Design requirements and invariants
- The contract must bind the reveal to a prior on-chain commitment from the same `msg.sender`.
- The contract must enforce a minimum commit-to-reveal delay.
- The app must ensure the commit transaction is confirmed before sending reveal.
- The salt must be sufficiently random.
- The contract must not store the secret on-chain.

## 7. UX notes
- Claim becomes a 2-transaction flow (commit, then reveal+claim).
- The claimant wallet does not need to be specified at lock creation time.
- The depositor still shares only the secret out-of-band.

## 8. Open items
- Finalize `MIN_COMMIT_DELAY_BLOCKS` based on chain conditions.
- Decide whether commitments are one-time-only per lock or overwriteable under strict rules.
- Decide whether to allow a separate receiver address or always transfer to `msg.sender`.
