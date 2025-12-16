import hre from "hardhat";

const { ethers } = hre as any;

async function main() {
  const factory = await ethers.getContractFactory("InheritanceHTLCTimelock");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("InheritanceHTLCTimelock deployed to:", address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
