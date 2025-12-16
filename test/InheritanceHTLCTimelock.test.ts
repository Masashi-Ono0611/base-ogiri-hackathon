import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre as any;

describe("InheritanceHTLCTimelock", () => {
  it("creates a lock and allows claim after timelock with correct secret", async () => {
    const [depositor, beneficiary] = await ethers.getSigners();

    const tokenFactory = await ethers.getContractFactory("MockERC20");
    const token = (await tokenFactory.deploy("Mock USDC", "mUSDC")) as any;
    await token.waitForDeployment();

    const htlcFactory = await ethers.getContractFactory("InheritanceHTLCTimelock");
    const htlc = (await htlcFactory.deploy()) as any;
    await htlc.waitForDeployment();

    const amount = ethers.parseUnits("10", 18);
    await token.mint(depositor.address, amount);

    await token.connect(depositor).approve(await htlc.getAddress(), amount);

    const secret = ethers.toUtf8Bytes("my-secret");
    const hashlock = ethers.keccak256(secret);

    const latest = await ethers.provider.getBlock("latest");
    const unlockTime = BigInt((latest?.timestamp ?? 0) + 3600);

    const tx = await htlc
      .connect(depositor)
      .createLock(await token.getAddress(), beneficiary.address, amount, hashlock, Number(unlockTime));

    const receipt = await tx.wait();
    const event = receipt!.logs.find((l: any) => l.fragment?.name === "LockCreated");
    const lockId = event!.args.lockId as bigint;

    await expect(htlc.connect(beneficiary).claim(lockId, secret)).to.be.revertedWithCustomError(
      htlc,
      "TimelockNotExpired"
    );

    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine", []);

    await expect(() => htlc.connect(beneficiary).claim(lockId, secret)).to.changeTokenBalances(
      token,
      [beneficiary],
      [amount]
    );

    const lock = await htlc.getLock(lockId);
    expect(lock.claimed).to.eq(true);
  });
});
