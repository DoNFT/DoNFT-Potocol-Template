require('dotenv').config();
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require('@openzeppelin/hardhat-upgrades');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.14",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 200000,
          },
        },
      },
    ],
  },
  networks: {
    mainnet: {
      url: process.env.MAINNET_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    ropsten: {
      url: process.env.ROPSTEN_URL,
      accounts: [process.env.PRIVATE_KEY],
      proxyAddress: process.env.ROPSTEN_PROXY_ADDRESS
    },
    rinkeby: {
      url: process.env.RINKEBY_URL,
      accounts: [process.env.PRIVATE_KEY],
      proxyAddress: process.env.RINKEBY_PROXY_ADDRESS
    },
    harmonyTestnet: {
      url: process.env.HARMONY_URL,
      accounts: [process.env.PRIVATE_KEY],
      proxyAddress: process.env.HARMONY_PROXY_ADDRESS
    },
    // auroraDevnet: {
    //   url: process.env.AURORA_DEV_URL,
    //   accounts: [process.env.PRIVATE_KEY],
    //   proxyAddress: process.env.AURORA_PROXY_ADDRESS
    // },
    polygon: {
      url: process.env.POLYGON_URL,
      accounts: [process.env.PRIVATE_KEY],
      proxyAddress: process.env.POLYGON_PROXY_ADDRESS,
      gas: 2100000,
      gasPrice: 8000000000
    },
    mumbay:{  //polygon
      url: process.env.MUMBAY_URL,
      accounts: [process.env.PRIVATE_KEY],
      proxyAddress: process.env.MUMBAY_PROXY_ADDRESS,
      gas: 2100000,
      gasPrice: 8000000000
    },
    neonDevnet:{
      url: process.env.NEON_DEV_URL,
      accounts: [process.env.PRIVATE_KEY],
      proxyAddress: process.env.NEON_PROXY_ADDRESS
    }
  },
  etherscan: {
    // API key for your Etherscan account
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
