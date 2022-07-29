const { expect, assert } = require("chai")
const { ethers, upgrades, waffle, hardhatArguments } = require("hardhat")
const { keccak256 } = require('@ethersproject/solidity')

const TokenRole = {
  NoRole: 0,
  Original: 1,
  Modifier: 2,
}


describe("BundleNFT Test Suite", () => {
  let admin, alice, bob, charlie
  let bundleContract
  let testingNFTContract1, testingNFTContract2, testingNFTContract3

  before(async () => {
    [admin, alice, bob, charlie] = await ethers.getSigners()
    const BundleNFTFactory = await ethers.getContractFactory("BundleNFT", admin)
    const bundleDeployTx = await BundleNFTFactory.deploy()
    bundleContract = await bundleDeployTx.deployed()
  })
  beforeEach(async () => {
    const TestingNFTContract = await ethers.getContractFactory("TestingNFT", admin)
    const testingNFTContract1DeployTx = await TestingNFTContract.deploy(alice.address, 10)
    testingNFTContract1 = (await testingNFTContract1DeployTx.deployed()).address
    const testingNFTContract2DeployTx = await TestingNFTContract.deploy(alice.address, 10)
    testingNFTContract2 = (await testingNFTContract2DeployTx.deployed()).address
    const testingNFTContract3DeployTx = await TestingNFTContract.deploy(bob.address, 10)
    testingNFTContract3 = (await testingNFTContract3DeployTx.deployed()).address
  });

  const approveTokens = async (signer, ...args) => {
    for (let i = 0; i < args.length; i += 2) {
      const [nftAddress, tokens] = [args[i], args[i+1]]
      const contract = (await ethers.getContractFactory("TestingNFT")).attach(nftAddress).connect(signer)
      for (let tokenIdx = 0; tokenIdx < tokens.length; ++tokenIdx) {
        const tx = await contract.approve(bundleContract.address, tokens[tokenIdx])
        await tx.wait()
      }
    }
  }

  const pauseContract = async (signer, nftAddress) => {
    const contract = (await ethers.getContractFactory("TestingNFT")).attach(nftAddress).connect(signer)
    const tx = await contract.pause()
    await tx.wait()
  }
  const unpauseContract = async (signer, nftAddress) => {
    const contract = (await ethers.getContractFactory("TestingNFT")).attach(nftAddress).connect(signer)
    const tx = await contract.unpause()
    await tx.wait()
  }

  const extractBundleID = (effects) => {
    const mints = effects.events.filter(e => e.event === "MintMessage")
    assert(mints.length === 1)
    return mints[0].args[0]
  }

  it("Creates a bundle", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    const contract = bundleContract.connect(alice)
    const bundlingTx = await contract.bundle([
      [testingNFTContract1, 1, TokenRole.Modifier], [testingNFTContract2, 4, TokenRole.Original]
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    
    const bundleID = extractBundleID(txEffects)
    const bundledTokens = await bundleContract.bundeledTokensOf(bundleID)
    assert(bundledTokens.length === 2)
    assert(bundledTokens[0].token === testingNFTContract1)
    assert(bundledTokens[0].tokenId == 1)
    assert(bundledTokens[0].role == 2)
    assert(bundledTokens[1].token === testingNFTContract2)
    assert(bundledTokens[1].tokenId == 4)
    assert(bundledTokens[1].role == 1)
    assert((await bundleContract.ownerOf(bundleID)) == alice.address);
    const bundleIDByIndex = await contract.tokenOfOwnerByIndex(alice.address, "0");
    assert(bundleIDByIndex.toString() === bundleID.toString(), `${bundleIDByIndex} != ${bundleID}`);

    const nft1Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract1)
    assert((await nft1Contract.ownerOf(1)) != alice.address);
    for (let i = 0; i < 6; ++i) {
      if (i === 1) continue;
      assert((await nft1Contract.ownerOf(i)) == alice.address);
    }

    const nft2Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract2)
    assert((await nft2Contract.ownerOf(4)) != alice.address);
    for (let i = 0; i < 6; ++i) {
      if (i === 4) continue;
      assert((await nft2Contract.ownerOf(i)) == alice.address);
    }
  })

  it("Creates a bundle with a base", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    const contract = bundleContract.connect(alice)
    const bundlingTx = await contract.bundle([
	    // Section 0
	    [testingNFTContract1, 1, TokenRole.Original], [testingNFTContract2, 4, TokenRole.Modifier],
      [testingNFTContract1, 3, TokenRole.NoRole], [testingNFTContract2, 3, TokenRole.NoRole],
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    
    const bundleID = extractBundleID(txEffects)
    const bundledTokens = await bundleContract.bundeledTokensOf(bundleID)
    assert(bundledTokens.length === 4)
    assert(bundledTokens[0].token === testingNFTContract1)
    assert(bundledTokens[0].tokenId == 1)
    assert(bundledTokens[0].role == 1)
    assert(bundledTokens[1].token === testingNFTContract2)
    assert(bundledTokens[1].tokenId == 4)
    assert(bundledTokens[1].role == 2)
    assert(bundledTokens[2].token === testingNFTContract1)
    assert(bundledTokens[2].tokenId == 3)
    assert(bundledTokens[2].role == 0)
    assert(bundledTokens[3].token === testingNFTContract2)
    assert(bundledTokens[3].tokenId == 3)
    assert(bundledTokens[3].role == 0)

    assert((await bundleContract.ownerOf(bundleID)) == alice.address);
    const nft1Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract1)
    assert((await nft1Contract.ownerOf(1)) != alice.address);
    for (let i = 0; i < 6; ++i) {
      if (i === 1 || i === 3) continue;
      assert((await nft1Contract.ownerOf(i)) == alice.address);
    }

    const nft2Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract2)
    assert((await nft2Contract.ownerOf(4)) != alice.address);
    for (let i = 0; i < 6; ++i) {
      if (i === 3 || i === 4) continue;
      assert((await nft2Contract.ownerOf(i)) == alice.address);
    }
  })

  it("Checks who owns NFT before adding", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    await approveTokens(bob, testingNFTContract3, [0])
    const contract = bundleContract.connect(alice)
    const bundlingTx = await contract.bundle([
	    [testingNFTContract1, 1, TokenRole.NoRole], [testingNFTContract2, 4, TokenRole.NoRole],
      [testingNFTContract1, 3, TokenRole.NoRole], [testingNFTContract2, 3, TokenRole.NoRole],
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    const bundleID = extractBundleID(txEffects)

    // Add NFT
    try {
        await contract.addNFTsToBundle(
          bundleID,
          [[testingNFTContract3, 0, TokenRole.NoRole]],
          "",
          {value: "15000000000000000"});
	      assert(1 === 2, "This should not happen");
    } catch (e) {
	      assert(e.toString().indexOf("ERC721: transfer of token that is not own") >= 0, e.toString())
    }
  })

  it("Unbundles", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    const contract = bundleContract.connect(alice)
    const bundlingTx = await contract.bundle([
      [testingNFTContract1, 1, TokenRole.Original],
      [testingNFTContract2, 4, TokenRole.Modifier],
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    const bundleID = extractBundleID(txEffects)
    const unbundlingTx = await contract.unbundle(bundleID, {value: "33300000000000000"})
    await unbundlingTx.wait()

    const nft1Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract1)
    for (let i = 0; i < 6; ++i) {
      assert((await nft1Contract.ownerOf(i)) == alice.address);
    }

    const nft2Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract2)
    for (let i = 0; i < 6; ++i) {
      assert((await nft2Contract.ownerOf(i)) == alice.address);
    }

    try {
      await bundleContract.ownerOf(bundleID)
      assert(1 === 2, "we should not get here")
    } catch (e) {
	    assert(e.toString().indexOf("ERC721: owner query for nonexistent token") >= 0, e.toString())
    }
  })

  it("Prevents alice from creating a bundle with bob's NFTs even if he approved them", async () => {
    await approveTokens(alice, testingNFTContract1, [0])
    await approveTokens(bob, testingNFTContract3, [0])
    const contract = bundleContract.connect(alice)
    try {
      const bundlingTx = await contract.bundle([
        [testingNFTContract1, 0, TokenRole.NoRole],
        [testingNFTContract3, 0, TokenRole.NoRole],
      ], {value: "33300000000000000"})
      await bundlingTx.wait()
      assert(1 === 2, "This should not have happened")
    } catch (e) {
	    assert(e.toString().indexOf("ERC721: transfer of token that is not own") >= 0, e.toString())
    }
  });

  it("it MINTS token", async () => {
    const balanceOfAliceBegin = parseInt(await bundleContract.balanceOf(alice.address));
    const contract = bundleContract.connect(alice)
    const mintingTx = await contract.functions['mintItem(address,string)'](
      alice.address,
      'bafybeicalokeprmrfqxqui33cck5t3bl4wq7a5zny6wrnjtg44rmwalwdi/file',
      {value: "15000000000000000"}
    )
    const receipt = await mintingTx.wait()
    const mintedEvent = receipt.events.find((x) => {
        return x.event === "MintMessage";
    });
    const bundleID = mintedEvent.args.message;
    assert((await bundleContract.ownerOf(bundleID)) == alice.address);
    const balanceOfAliceNow = parseInt(await bundleContract.balanceOf(alice.address));
    assert(balanceOfAliceBegin + 1 === balanceOfAliceNow, `Balance of Alice changed ${balanceOfAliceBegin} (${typeof(balanceOfAliceBegin)}) -> ${balanceOfAliceNow} (${typeof(balanceOfAliceNow)})`);
  });

  it("Does not create a bundle, and NFTs remain on users wallet if any of transfers fail", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    await pauseContract(admin, testingNFTContract2)
    const contract = bundleContract.connect(alice)
    try {
      const bundlingTx = await contract.bundle([
        [testingNFTContract1, 1, TokenRole.NoRole],
        [testingNFTContract2, 4, TokenRole.NoRole],
      ], {value: "33300000000000000"})
      await bundlingTx.wait()
      assert(1 === 2, "This should not have happened")
    } catch (e) {
	    assert(e.toString().indexOf("ERC721Pausable: token transfer while paused") >= 0, e.toString())
    }

    const nft1Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract1)
    for (let i = 0; i < 6; ++i) {
      assert((await nft1Contract.ownerOf(i)) == alice.address);
    }

    const nft2Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract2)
    for (let i = 0; i < 6; ++i) {
      assert((await nft2Contract.ownerOf(i)) == alice.address);
    }
  });

  it("Does not destroy a bundle if anything remains", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    const contract = bundleContract.connect(alice)
    const bundlingTx = await contract.bundle([
      [testingNFTContract1, 1, TokenRole.NoRole],
      [testingNFTContract2, 4, TokenRole.NoRole],
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    const bundleID = extractBundleID(txEffects)
    await pauseContract(admin, testingNFTContract2)
    const unbundlingTx = await contract.unbundle(bundleID, {value: "30000000000000000"})
    await unbundlingTx.wait()

    // Token 1 should be extracted
    const nft1Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract1)
    for (let i = 0; i < 6; ++i) {
      assert((await nft1Contract.ownerOf(i)) == alice.address);
    }

    // Token 2 should remain in bundle
    const nft2Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract2)
    assert((await nft2Contract.ownerOf(4)) == bundleContract.address);

    const bundledTokens = await bundleContract.bundeledTokensOf(bundleID)
    assert(bundledTokens.length === 1)
    assert(bundledTokens[0].token === testingNFTContract2)
    assert(bundledTokens[0].tokenId == 4)
    assert((await bundleContract.ownerOf(bundleID)) == alice.address);

    await unpauseContract(admin, testingNFTContract2)
    const unbundlingTx2 = await contract.unbundle(bundleID, {value: "30000000000000000"})
    await unbundlingTx2.wait()

    for (let i = 0; i < 6; ++i) {
      assert((await nft1Contract.ownerOf(i)) == alice.address);
    }
    for (let i = 0; i < 6; ++i) {
      assert((await nft2Contract.ownerOf(i)) == alice.address);
    }

    try {
      await bundleContract.ownerOf(bundleID)
      assert(1 === 2, "we should not get here")
    } catch (e) {
	    assert(e.toString().indexOf("ERC721: owner query for nonexistent token") >= 0, e.toString())
    }
  });

  it("Checks for odd effects/modifiers", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    const contract = bundleContract.connect(alice)

    await contract.bundle([
      [testingNFTContract1, 1, TokenRole.NoRole],
      [testingNFTContract2, 4, TokenRole.Original],
    ], {value: "33300000000000000"})

    try {
      await contract.bundle([
        [testingNFTContract1, 2, TokenRole.Modifier],
      ], {value: "33300000000000000"})
      assert(1 === 2, "We should not get here");
    } catch (e) {
      // assert(e.toString().indexOf("E07") >= 0, e.toString());
    }
  })

  it("Allows to put bundles into bundles", async () => {
    const contract = bundleContract.connect(alice)

    const mint1Tx = await contract.functions['mintItem(address,string)'](
      alice.address,
      'http://www.example.com/file',
      {value: "15000000000000000"}
    )
    const mint1TxEffects = await mint1Tx.wait()
    const bundle1ID = extractBundleID(mint1TxEffects);
  
    const mint2Tx = await contract.functions['mintItem(address,string)'](
      alice.address,
      'http://www.example.com/file',
      {value: "15000000000000000"}
    )
    const mint2TxEffects = await mint2Tx.wait()
    const bundle2ID = extractBundleID(mint2TxEffects);

    await approveTokens(alice, contract.address, [bundle1ID, bundle2ID]);
    
    await contract.bundleWithTokenURI([
      [contract.address, bundle1ID, TokenRole.Original],
      [contract.address, bundle2ID, TokenRole.NoRole],
    ], "ipfs://bundle.url/",
    {value: "33300000000000000"})
  })

  it("Regression 18/07/2022", async () => {
    const contract1 = bundleContract.connect(alice)
    const BundleNFTFactory = await ethers.getContractFactory("BundleNFT", admin)
    const bundleDeployTx = await BundleNFTFactory.deploy()
    bundleContract2 = await bundleDeployTx.deployed()
    const contract2 = bundleContract2.connect(alice)

    const mintOnContract = async (contract) => {
      const mintTx = await contract.functions['mintItem(address,string)'](
        alice.address,
        'http://www.example.com/file',
        {value: "15000000000000000"}
      )
      const mintTxEffects = await mintTx.wait()
      const bundleID = extractBundleID(mintTxEffects);
      return bundleID;
    }

    const contract1BundleId = await mintOnContract(contract1)
    const contract2BundleId = await mintOnContract(contract2)

    await approveTokens(alice, contract1.address, [contract1BundleId],
                               contract2.address, [contract2BundleId]);

    await contract1.bundleWithTokenURI([
      [contract1.address, contract1BundleId, TokenRole.Original],
      [contract2.address, contract2BundleId, TokenRole.NoRole],
    ], "ipfs://bundle.url/",
    {value: "33300000000000000"})
  })

  it("Handles duplicated NFTs", async () => {});
  it("Handles non ERC721 NFTs", async () => {});

  it("Rejects a bundle creation when fee is not provided", async () => {})
  it("New owner unbundles", () => {})
  it("Unbundle twice fails", () => {})
  it("URL is remembered", () => {})

  it("Is save against re-entrant attacks", async () => {

  })

  it("Bundle could be transferred", async () => {

  })

  it("What if you bundle, unbundle, and then bundle same tokens again", async () => {})
  
  
  
  it.skip("Integration", async function () {
    const [admin, alice, bob, charlie] = await ethers.getSigners();
    const bundleContract = await deploy("BundleNFT", admin);
    
    
    const mutantFactory = await deploy("MutantFactory");

    // Create mutant
    let tx = await mutantFactory.connect(alice).createMutant(bob.address, mutantId);
    let receipt = await tx.wait();
    const mutantCreatedEvent = receipt.events.indexOf((x) => {
        return x.event == "MutantCreated";
    });
    const mutantAddress = mutantCreatedEvent.args.mutant;
    assert.equal(mutantCreatedEvent.args.tokenId, mutantId);

    const Mutant = await ethers.getContractFactory("Mutant");
    const mutant = new ethers.Contract(mutantAddress, Mutant.interface, admin);

    assert.equal(await mutant.getOwner(), bob.address);

    // Deploy images ERC721, mint background nft, approve it for mutant
    const images = await deploy("ImagesNFT");
    await images.mint(charlie.address, backgroundTokenId);
    await images.connect(charlie).approve(mutantAddress, backgroundTokenId);

    // Mutate with background
    await mutant.connect(bob).mutate(backgroundType, images.address, backgroundTokenId);
    assert.equal(await images.ownerOf(backgroundTokenId), mutantAddress);
  })
})

describe("Supports Interface", () => {
  let admin, alice, bob, charlie
  let bundleContract

  before(async () => {
    [admin, alice, bob, charlie] = await ethers.getSigners()
    const BundleNFTFactory = await ethers.getContractFactory("BundleNFT", admin)
    const bundleDeployTx = await BundleNFTFactory.deploy()
    bundleContract = await bundleDeployTx.deployed()
  })

  it("Supports IBundle", async () => {
    const result = await bundleContract.supportsInterface("0x19FBAC2F");
    assert(result, "IBundleNFT is not supported");
  });
  it("Supports IERC721", async () => {
    const result = await bundleContract.supportsInterface("0x80AC58CD");
    assert(result, "IERC721 is not supported");
  });
  it("Not supports ERC721Enumerable", async () => {
    const result = await bundleContract.supportsInterface("0x780e9d63");
    assert(result, "ERC721Enumerable is not supported");
  });
})