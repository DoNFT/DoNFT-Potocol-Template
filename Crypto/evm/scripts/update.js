require('@openzeppelin/hardhat-upgrades');
const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("Deploying implementation contract...");
  const BundleNFT = await ethers.getContractFactory("BundleNFT");
  const bundleNFT = await BundleNFT.deploy();
  await bundleNFT.deployed();
  console.log("Implementation deployed to:", bundleNFT.address);
  
  console.log("Updating proxy contract " + process.env.PROXY_ADDRESS);
  const Proxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
  const proxy = await Proxy.attach(process.env.PROXY_ADDRESS);
  // хз почему такой способ не работает
  //const proxyV2 = await upgrades.upgradeProxy(process.env.PROXY_ADDRESS, BundleNFT);
  await proxy.upgradeTo(bundleNFT.address);
  console.log("Proxy updated ", proxy.address);
  
  console.log("Delay before verification...");
  await new Promise(r => setTimeout(r, 60000));
  
  console.log("Verifying contracts...");
  await hre.run("verify:verify", {
    address: bundleNFT.address,
    constructorArguments: [],
  });
  console.log("Done!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
