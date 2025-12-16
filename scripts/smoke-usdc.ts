import hre from "hardhat";

const { ethers } = hre as any;

const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
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

  const balanceBefore = await usdc.balanceOf(signer.address);
  console.log("USDC balance (before):", balanceBefore.toString());

  if (balanceBefore < amount) {
    throw new Error("Insufficient USDC balance for smoke test. Please fund the deployer with Base Sepolia USDC.");
  }

  const secretBytes = ethers.randomBytes(32);
  const hashlock = ethers.keccak256(secretBytes);

  const unlockDelaySeconds = 60;
  const latest = await ethers.provider.getBlock("latest");
  const unlockTime = BigInt((latest?.timestamp ?? 0) + unlockDelaySeconds);

  console.log("HTLC contract:", contractAddress);
  console.log("Hashlock:", hashlock);
  console.log("UnlockTime (unix):", unlockTime.toString());

  const approveTx = await usdc.approve(contractAddress, amount);
  console.log("Approve tx:", approveTx.hash);
  await approveTx.wait();

  const createTx = await htlc.createLock(USDC_BASE_SEPOLIA, amount, hashlock, Number(unlockTime));
  console.log("CreateLock tx:", createTx.hash);
  const receipt = await createTx.wait();

  const createdLog = receipt.logs.find((l: any) => l.fragment?.name === "LockCreated");
  if (!createdLog) throw new Error("LockCreated event not found");

  const lockId = createdLog.args.lockId as bigint;
  console.log("LockId:", lockId.toString());

  const stored = await htlc.getLock(lockId);
  console.log("Stored.hashlock:", stored.hashlock);
  console.log("Stored.unlockTime:", stored.unlockTime.toString());
  console.log("Stored.claimed:", stored.claimed);
  if (stored.hashlock !== hashlock) {
    throw new Error("Hashlock mismatch between script and contract storage");
  }

  while (true) {
    const b = await ethers.provider.getBlock("latest");
    const now = BigInt(b?.timestamp ?? 0);
    if (now >= unlockTime) break;
    await sleep(5_000);
  }

  await sleep(5_000);

  const txReq = await htlc.claim.populateTransaction(lockId, secretBytes);
  const sent = await signer.sendTransaction({
    ...txReq,
    gasLimit: 300_000,
  });
  console.log("Claim tx:", sent.hash);
  await sent.wait();

  const balanceAfter = await usdc.balanceOf(signer.address);
  console.log("USDC balance (after):", balanceAfter.toString());
  console.log("Delta:", (balanceAfter - balanceBefore).toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
