import hre from "hardhat";

const { ethers } = hre as any;

const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function safeBalanceOf(usdc: any, address: string, blockTag?: number) {
  if (blockTag === undefined) return (await usdc.balanceOf(address)) as bigint;

  try {
    return (await usdc.balanceOf(address, { blockTag })) as bigint;
  } catch (e: any) {
    console.log("balanceOf(blockTag) failed, falling back to latest. blockTag=", blockTag, "error=", e?.message ?? e);
    return (await usdc.balanceOf(address)) as bigint;
  }
}

async function logUsdcBalances(label: string, usdc: any, wallet: string, contractAddress: string, blockTag?: number) {
  const walletBal = await safeBalanceOf(usdc, wallet, blockTag);
  const contractBal = await safeBalanceOf(usdc, contractAddress, blockTag);
  console.log(`[${label}] walletUSDC=${walletBal.toString()} contractUSDC=${contractBal.toString()}`);
  return { walletBal, contractBal };
}

async function safeGetLock(htlc: any, lockId: bigint, blockTag?: number) {
  if (blockTag === undefined) return await htlc.getLock(lockId);

  try {
    return await htlc.getLock(lockId, { blockTag });
  } catch (e: any) {
    console.log("getLock(blockTag) failed, falling back to latest. blockTag=", blockTag, "error=", e?.message ?? e);
    return await htlc.getLock(lockId);
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForNoPendingTx(address: string) {
  while (true) {
    const latest = await ethers.provider.getTransactionCount(address, "latest");
    const pending = await ethers.provider.getTransactionCount(address, "pending");
    if (pending <= latest) return;
    console.log("Waiting pending txs...");
    await sleep(5_000);
  }
}

async function main() {
  const contractAddress = requireEnv("HTLC_CONTRACT_ADDRESS");

  const [signer] = await ethers.getSigners();

  const usdc = await ethers.getContractAt(
    [
      "function decimals() view returns (uint8)",
      "function balanceOf(address) view returns (uint256)",
      "function approve(address spender, uint256 value) returns (bool)",
      "event Transfer(address indexed from, address indexed to, uint256 value)",
    ],
    USDC_BASE_SEPOLIA,
    signer
  );

  const htlc = await ethers.getContractAt("InheritanceHTLCTimelock", contractAddress, signer);

  const decimals: number = await usdc.decimals();
  const amount = ethers.parseUnits("0.01", decimals);

  const before = await logUsdcBalances("before", usdc, signer.address, contractAddress);

  if (before.walletBal < amount) {
    throw new Error("Insufficient USDC balance for smoke test. Please fund the deployer with Base Sepolia USDC.");
  }

  const secretBytes = ethers.randomBytes(32);
  const saltBytes = ethers.randomBytes(32);
  const hashlock = ethers.keccak256(secretBytes);

  console.log("Secret(hex):", ethers.hexlify(secretBytes));
  console.log("Salt(hex):", ethers.hexlify(saltBytes));

  const unlockDelaySeconds = 30;
  const latest = await ethers.provider.getBlock("latest");
  const unlockTime = BigInt((latest?.timestamp ?? 0) + unlockDelaySeconds);

  console.log("HTLC contract:", contractAddress);
  console.log("Hashlock:", hashlock);
  console.log("UnlockTime (unix):", unlockTime.toString());

  await waitForNoPendingTx(signer.address);
  const approveTx = await usdc.approve(contractAddress, amount);
  console.log("Approve tx:", approveTx.hash);
  await approveTx.wait();

  await waitForNoPendingTx(signer.address);
  const createTx = await htlc.createLock(USDC_BASE_SEPOLIA, amount, hashlock, Number(unlockTime));
  console.log("CreateLock tx:", createTx.hash);
  const receipt = await createTx.wait();

  await sleep(2_000);

  const afterCreate = await logUsdcBalances("after create", usdc, signer.address, contractAddress, receipt.blockNumber);
  console.log(
    `[delta after create] wallet=${(afterCreate.walletBal - before.walletBal).toString()} contract=${(
      afterCreate.contractBal - before.contractBal
    ).toString()}`
  );

  const createdLog = receipt.logs.find((l: any) => l.fragment?.name === "LockCreated");
  if (!createdLog) throw new Error("LockCreated event not found");

  const lockId = createdLog.args.lockId as bigint;
  console.log("LockId:", lockId.toString());

  const commitment = ethers.solidityPackedKeccak256(
    ["uint256", "address", "bytes", "bytes"],
    [lockId, signer.address, secretBytes, saltBytes]
  );
  const minDelayBlocks = Number(await htlc.MIN_COMMIT_DELAY_BLOCKS());
  console.log("MIN_COMMIT_DELAY_BLOCKS:", minDelayBlocks);

  while (true) {
    const b = await ethers.provider.getBlock("latest");
    const now = BigInt(b?.timestamp ?? 0);
    if (now >= unlockTime) break;
    console.log("Waiting timelock... now=", now.toString(), "unlockTime=", unlockTime.toString());
    await sleep(5_000);
  }

  await waitForNoPendingTx(signer.address);
  const commitTx = await htlc.commit(lockId, commitment);
  console.log("Commit tx:", commitTx.hash);
  const commitReceipt = await commitTx.wait();
  const commitBlockNumber = commitReceipt?.blockNumber;
  if (!commitBlockNumber) throw new Error("Commit receipt missing blockNumber");

  while (true) {
    const current = await ethers.provider.getBlockNumber();
    const target = commitBlockNumber + minDelayBlocks;
    if (current >= target) break;
    console.log("Waiting commit delay... currentBlock=", current, "targetBlock=", target);
    await sleep(5_000);
  }

  await sleep(5_000);

  await waitForNoPendingTx(signer.address);
  const revealTx = await htlc.revealAndClaim(lockId, secretBytes, saltBytes, {
    gasLimit: 350_000,
  });
  console.log("RevealAndClaim tx:", revealTx.hash);
  const revealReceipt = await revealTx.wait();

  await sleep(2_000);

  const afterClaim = await logUsdcBalances("after claim", usdc, signer.address, contractAddress, revealReceipt.blockNumber);
  console.log(
    `[delta total] wallet=${(afterClaim.walletBal - before.walletBal).toString()} contract=${(
      afterClaim.contractBal - before.contractBal
    ).toString()}`
  );

  const storedAfter = await safeGetLock(htlc, lockId, revealReceipt.blockNumber);
  console.log("Lock claimed:", storedAfter.claimed);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
