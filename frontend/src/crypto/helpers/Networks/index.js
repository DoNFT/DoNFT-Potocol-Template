const networks = {
    sepolia: {
        meta: {
            title: 'Sepolia',
            image: 'ether',
            chainId: 11155111,
            transactionExplorer: "https://sepolia.etherscan.io/tx/",
            accountExplorer: "https://sepolia.etherscan.io/address/",
            marketplaceExplorer: (contractAddress, tokenID) => `https://testnets.opensea.io/assets/mumbai/${contractAddress}/${tokenID}`,
            gasLimit: 400000
        },
        contracts: {
            whiteListContract: '0x6094591a55d25d447e3ce32b7d43a00b6bf20a64'
        }
    },
    maticmum: {
        meta: {
            title: 'Mumbai testnet',
            image: 'polygon',
            chainId: 80001,
            transactionExplorer: "https://mumbai.polygonscan.com/tx/",
            accountExplorer: "https://mumbai.polygonscan.com/address/",
            marketplaceExplorer: (contractAddress, tokenID) => `https://testnets.opensea.io/assets/mumbai/${contractAddress}/${tokenID}`,
            gasLimit: 400000
        },
        contracts: {
            whiteListContract: '0x2fa0b7dd476ba4d972ab1a103a5b48acec0e8af3',
        }
    }
}
Object.freeze(networks)

export function getAvailableNetworks() {
    return Object.entries(networks)
        .filter(([name, {meta, contracts}]) => {
            return !!+process.env[`VUE_APP_NETWORK_${name.toUpperCase()}_SUPPORT`] &&
                meta.title &&
                meta.image &&
                meta.chainId &&
                contracts.whiteListContract
        })
        .map(([name, {meta: {title, image, chainId}}], index) => ({
            id: chainId,
            name: title,
            key: image,
            available: true
        }))
}

export function getNameByChainID(chainID){
    const [name] = Object.entries(networks).find(([, data]) => data.meta.chainId === chainID) || ['unknown']
    let isSupport = (name !== 'unknown')? !!+process.env[`VUE_APP_NETWORK_${name.toUpperCase()}_SUPPORT`] : false
    return isSupport? name : 'unknown'
}

export function getData(networkName){
    return networks[networkName.toLowerCase()]?.meta || null
}

export function getSettings(networkName){
    return networks[networkName.toLowerCase()]?.contracts || null
}