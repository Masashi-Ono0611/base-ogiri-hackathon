// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract InheritanceHTLCTimelock is ReentrancyGuard {
  using SafeERC20 for IERC20;

  uint64 public constant MIN_COMMIT_DELAY_BLOCKS = 3;

  struct Lock {
    address depositor;
    address token;
    uint256 amount;
    bytes32 hashlock;
    uint64 unlockTime;
    bool claimed;
  }

  struct CommitState {
    bytes32 commitment;
    address committer;
    uint64 commitBlock;
  }

  error InvalidAmount();
  error InvalidUnlockTime();
  error LockNotFound();
  error LockAlreadyClaimed();
  error TimelockNotExpired();
  error InvalidSecret();
  error CommitmentAlreadySet();
  error CommitmentNotFound();
  error CommitDelayNotElapsed();
  error CommitterMismatch();
  error InvalidCommitment();

  event LockCreated(
    uint256 indexed lockId,
    address indexed depositor,
    address token,
    uint256 amount,
    bytes32 hashlock,
    uint64 unlockTime
  );

  event LockCommitted(uint256 indexed lockId, address indexed committer, bytes32 commitment, uint64 commitBlock);

  event LockClaimed(uint256 indexed lockId, address indexed claimer);

  uint256 private _nextLockId = 1;
  mapping(uint256 => Lock) private _locks;
  mapping(uint256 => CommitState) private _commits;

  function getLock(uint256 lockId) external view returns (Lock memory) {
    Lock memory l = _locks[lockId];
    if (l.depositor == address(0)) revert LockNotFound();
    return l;
  }

  function createLock(
    address token,
    uint256 amount,
    bytes32 hashlock,
    uint64 unlockTime
  ) external returns (uint256 lockId) {
    if (amount == 0) revert InvalidAmount();
    if (unlockTime <= uint64(block.timestamp)) revert InvalidUnlockTime();

    lockId = _nextLockId++;

    _locks[lockId] = Lock({
      depositor: msg.sender,
      token: token,
      amount: amount,
      hashlock: hashlock,
      unlockTime: unlockTime,
      claimed: false
    });

    IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

    emit LockCreated(lockId, msg.sender, token, amount, hashlock, unlockTime);
  }

  function commit(uint256 lockId, bytes32 commitment) external {
    Lock storage l = _locks[lockId];
    if (l.depositor == address(0)) revert LockNotFound();
    if (l.claimed) revert LockAlreadyClaimed();

    CommitState storage c = _commits[lockId];
    if (c.commitment != bytes32(0)) revert CommitmentAlreadySet();

    c.commitment = commitment;
    c.committer = msg.sender;
    c.commitBlock = uint64(block.number);

    emit LockCommitted(lockId, msg.sender, commitment, c.commitBlock);
  }

  function revealAndClaim(uint256 lockId, bytes calldata secret, bytes calldata salt) external nonReentrant {
    Lock storage l = _locks[lockId];
    if (l.depositor == address(0)) revert LockNotFound();
    if (l.claimed) revert LockAlreadyClaimed();
    if (uint64(block.timestamp) < l.unlockTime) revert TimelockNotExpired();

    CommitState storage c = _commits[lockId];
    if (c.commitment == bytes32(0)) revert CommitmentNotFound();
    if (c.committer != msg.sender) revert CommitterMismatch();
    if (uint64(block.number) < c.commitBlock + MIN_COMMIT_DELAY_BLOCKS) revert CommitDelayNotElapsed();

    bytes32 computedHashlock = keccak256(secret);
    if (computedHashlock != l.hashlock) revert InvalidSecret();

    bytes32 computedCommitment = keccak256(abi.encodePacked(lockId, msg.sender, secret, salt));
    if (computedCommitment != c.commitment) revert InvalidCommitment();

    l.claimed = true;
    delete _commits[lockId];

    IERC20(l.token).safeTransfer(msg.sender, l.amount);

    emit LockClaimed(lockId, msg.sender);
  }
}
