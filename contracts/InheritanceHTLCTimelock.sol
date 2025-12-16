// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract InheritanceHTLCTimelock is ReentrancyGuard {
  using SafeERC20 for IERC20;

  struct Lock {
    address depositor;
    address token;
    uint256 amount;
    bytes32 hashlock;
    uint64 unlockTime;
    bool claimed;
  }

  error InvalidAmount();
  error InvalidUnlockTime();
  error LockNotFound();
  error LockAlreadyClaimed();
  error TimelockNotExpired();
  error InvalidSecret();

  event LockCreated(
    uint256 indexed lockId,
    address indexed depositor,
    address token,
    uint256 amount,
    bytes32 hashlock,
    uint64 unlockTime
  );

  event LockClaimed(uint256 indexed lockId, address indexed claimer);

  uint256 private _nextLockId = 1;
  mapping(uint256 => Lock) private _locks;

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

  function claim(uint256 lockId, bytes calldata secret) external nonReentrant {
    Lock storage l = _locks[lockId];
    if (l.depositor == address(0)) revert LockNotFound();
    if (l.claimed) revert LockAlreadyClaimed();
    if (uint64(block.timestamp) < l.unlockTime) revert TimelockNotExpired();

    bytes32 computed = keccak256(secret);
    if (computed != l.hashlock) revert InvalidSecret();

    l.claimed = true;

    IERC20(l.token).safeTransfer(msg.sender, l.amount);

    emit LockClaimed(lockId, msg.sender);
  }
}
