const hre = require("hardhat");

async function main() {
  const TokenSymbol = "TKN";
  const TokenName = "Token";
  const signers = await hre.ethers.getSigners();

  console.log("Deploying implementation contract...");
  //const BundleNFT = await hre.ethers.getContractFactory("EffectsAllowList");
  const BundleNFT = await hre.ethers.getContractFactory("BundleNFT");
  const bundleNFT = await BundleNFT.deploy();
  await bundleNFT.deployed();
  console.log("Implementation deployed to:", bundleNFT.address);
  
  console.log("Deploying proxy contract...");
  const Proxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
  const init = await bundleNFT.populateTransaction.__BundleNFT_init(TokenName, TokenSymbol);
  const proxy = await Proxy.deploy(bundleNFT.address, signers[0].address, init.data);
  await proxy.deployed();
  console.log("Contract deployed to:", proxy.address);
  
  console.log("Delay before verification...");
  await new Promise(r => setTimeout(r, 60000));
  
  // console.log("Verifying contracts...");
  // await hre.run("verify:verify", {
  //   address: bundleNFT.address,
  //   constructorArguments: [],
  // });
  // await hre.run("verify:verify", {
  //   address: proxy.address,
  //   constructorArguments: [bundleNFT.address, signers[0].address, init.data],
  // });
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
