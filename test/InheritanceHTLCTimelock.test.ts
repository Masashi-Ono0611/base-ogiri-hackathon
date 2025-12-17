import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre as any;

describe("InheritanceHTLCTimelock", () => {
  async function deployFixture() {
    const [depositor, claimer, other] = await ethers.getSigners();

    const tokenFactory = await ethers.getContractFactory("MockERC20");
    const token = (await tokenFactory.deploy("Mock USDC", "mUSDC")) as any;
    await token.waitForDeployment();

    const htlcFactory = await ethers.getContractFactory("InheritanceHTLCTimelock");
    const htlc = (await htlcFactory.deploy()) as any;
    await htlc.waitForDeployment();

    return { depositor, claimer, other, token, htlc };
  }

  async function createLockFixture(params?: {
    amount?: bigint;
    unlockOffsetSeconds?: number;
    secret?: Uint8Array;
    salt?: Uint8Array;
  }) {
    const { depositor, claimer, other, token, htlc } = await deployFixture();

    const amount = params?.amount ?? ethers.parseUnits("10", 18);
    const secret = params?.secret ?? ethers.toUtf8Bytes("my-secret");
    const salt = params?.salt ?? ethers.toUtf8Bytes("my-salt");
    const hashlock = ethers.keccak256(secret);

    const latest = await ethers.provider.getBlock("latest");
    const unlockOffsetSeconds = params?.unlockOffsetSeconds ?? 3600;
    const unlockTime = BigInt((latest?.timestamp ?? 0) + unlockOffsetSeconds);

    await token.mint(depositor.address, amount);
    await token.connect(depositor).approve(await htlc.getAddress(), amount);

    const tx = await htlc.connect(depositor).createLock(await token.getAddress(), amount, hashlock, Number(unlockTime));
    const receipt = await tx.wait();
    const event = receipt!.logs.find((l: any) => l.fragment?.name === "LockCreated");
    const lockId = event!.args.lockId as bigint;

    const commitmentForLock = ethers.solidityPackedKeccak256(
      ["uint256", "address", "bytes", "bytes"],
      [lockId, claimer.address, secret, salt]
    );

    return {
      depositor,
      claimer,
      other,
      token,
      htlc,
      lockId,
      amount,
      secret,
      salt,
      hashlock,
      unlockTime,
      commitment: commitmentForLock,
    };
  }

  it("allows committer to revealAndClaim after timelock and commit delay", async () => {
    const { claimer, token, htlc, lockId, amount, secret, salt, commitment } = await createLockFixture();

    await expect(htlc.connect(claimer).commit(lockId, commitment)).to.emit(htlc, "LockCommitted");

    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine", []);

    await expect(htlc.connect(claimer).revealAndClaim(lockId, secret, salt)).to.be.revertedWithCustomError(
      htlc,
      "CommitDelayNotElapsed"
    );

    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);

    await expect(() => htlc.connect(claimer).revealAndClaim(lockId, secret, salt)).to.changeTokenBalances(
      token,
      [claimer],
      [amount]
    );
  });

  it("reverts with InvalidSecret for wrong secret", async () => {
    const { claimer, htlc, lockId, salt, commitment } = await createLockFixture();

    await htlc.connect(claimer).commit(lockId, commitment);

    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);

    const wrongSecret = ethers.toUtf8Bytes("wrong-secret");
    await expect(htlc.connect(claimer).revealAndClaim(lockId, wrongSecret, salt)).to.be.revertedWithCustomError(
      htlc,
      "InvalidSecret"
    );
  });

  it("reverts with LockAlreadyClaimed on double claim", async () => {
    const { claimer, htlc, lockId, secret, salt, commitment } = await createLockFixture();

    await htlc.connect(claimer).commit(lockId, commitment);

    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);

    await htlc.connect(claimer).revealAndClaim(lockId, secret, salt);
    await expect(htlc.connect(claimer).revealAndClaim(lockId, secret, salt)).to.be.revertedWithCustomError(
      htlc,
      "LockAlreadyClaimed"
    );
  });

  it("reverts with LockNotFound for unknown lockId", async () => {
    const { claimer, htlc } = await deployFixture();
    await expect(
      htlc.connect(claimer).commit(999999, ethers.keccak256(ethers.toUtf8Bytes("x")))
    ).to.be.revertedWithCustomError(htlc, "LockNotFound");
  });

  it("reverts with InvalidAmount for zero amount", async () => {
    const { depositor, token, htlc } = await deployFixture();
    const secret = ethers.toUtf8Bytes("my-secret");
    const hashlock = ethers.keccak256(secret);
    const latest = await ethers.provider.getBlock("latest");
    const unlockTime = BigInt((latest?.timestamp ?? 0) + 3600);

    await expect(
      htlc.connect(depositor).createLock(await token.getAddress(), 0, hashlock, Number(unlockTime))
    ).to.be.revertedWithCustomError(htlc, "InvalidAmount");
  });

  it("reverts with InvalidUnlockTime for past unlockTime", async () => {
    const { depositor, token, htlc } = await deployFixture();
    const amount = ethers.parseUnits("1", 18);
    await token.mint(depositor.address, amount);
    await token.connect(depositor).approve(await htlc.getAddress(), amount);

    const secret = ethers.toUtf8Bytes("my-secret");
    const hashlock = ethers.keccak256(secret);
    const latest = await ethers.provider.getBlock("latest");
    const pastUnlockTime = BigInt((latest?.timestamp ?? 0) - 1);

    await expect(
      htlc.connect(depositor).createLock(await token.getAddress(), amount, hashlock, Number(pastUnlockTime))
    ).to.be.revertedWithCustomError(htlc, "InvalidUnlockTime");
  });

  it("prevents a mempool observer from stealing the claim using observed secret and salt", async () => {
    const { claimer, other, token, htlc, lockId, amount, secret, salt, commitment } = await createLockFixture();

    await htlc.connect(claimer).commit(lockId, commitment);

    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);

    await expect(htlc.connect(other).revealAndClaim(lockId, secret, salt)).to.be.revertedWithCustomError(
      htlc,
      "CommitterMismatch"
    );

    await expect(() => htlc.connect(claimer).revealAndClaim(lockId, secret, salt)).to.changeTokenBalances(
      token,
      [claimer],
      [amount]
    );
  });
});
