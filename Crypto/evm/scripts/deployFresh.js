const { ethers, upgrades } = require("hardhat");

async function main() {
  const [admin] = await ethers.getSigners();

  const BundleNFT = await ethers.getContractFactory("BundleNFT");
  const bundle = await upgrades.deployProxy(BundleNFT, ["DoNFT", "DNFT"]);
  await bundle.deployed();
  console.log("bundle deployed to:", bundle.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
