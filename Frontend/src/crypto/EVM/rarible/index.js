import Evm from "@/crypto/EVM";
import RaribleConnector from "@/crypto/EVM/rarible/Connector";
import SmartContract from "@/crypto/EVM/SmartContract";
import {AppStorage, ConnectionStore} from "@/crypto/helpers";

import {ActionTypes} from "@/crypto/helpers"

class Rarible extends Evm{

    connector = RaribleConnector

    constructor(){
        super()
    }

    async createBundle(meta, image, tokens){
        const {
            address,
            metaCID,
            tokensList
        } = await super.createBundle(meta, image, tokens)

        const contract = new SmartContract({
            address,
            type: 'bundle'
        })

        const storage = AppStorage.getStore()

        storage.setProcessStatus(ActionTypes.minting_bundle)
        const result = await contract.makeBundle(tokensList, metaCID, storage.setProcessStatus)

        return {
            transactionHash: result.transactionHash,
            issuedContractAddress: address
        }
    }

    async applyEffectToToken({name, link, description}, original, effect){
        const {
            resultTokenCID,
            contractAddress,
            tokensList,
            tempImage
        } = await super.applyEffectToToken({name, link, description}, original, effect)


        const contract = new SmartContract({
            address: contractAddress,
            type: 'bundle'
        })

        const storage = AppStorage.getStore()
        storage.setProcessStatus(ActionTypes.minting_bundle)

        const result = await contract.makeBundle(tokensList, resultTokenCID, storage.setProcessStatus)

        return {
            transactionHash: result.transactionHash,
            issuedContractAddress: contractAddress,
            tempImage
        }
    }

    async addTokensToBundle(originToken, needToAddTokenList){
        const {
            addingTokenList
        } = await super.addTokensToBundle(needToAddTokenList)

        const contract = new SmartContract({
            address: originToken.contractAddress,
            type: 'bundle'
        })

        const store = AppStorage.getStore()
        await contract.approveTokenList(addingTokenList, store.setProcessStatus)

        store.setProcessStatus(ActionTypes.adding_to_bundle)
        return await contract.addToBundle(originToken.id, addingTokenList)
    }

    async removeAssetsFromBundle(originToken, removeToken){
        const {
            removingTokens
        } = await super.removeAssetsFromBundle([removeToken])

        const contract = new SmartContract({
            address: originToken.contractAddress,
            type: 'bundle'
        })

        return await contract.removeFromBundle(originToken.id, removingTokens)
    }

    async unbundleToken(token){
        const contract = new SmartContract({
            address: token.contractAddress,
            type: 'bundle'
        })
        return await contract.unwrapToken(token.id)
    }

    async createNewToken(meta, image, contractAddress){
        const {
            metaCID
        } = await super.createTokenMeta(meta, image)

        const contract = new SmartContract({
            address: contractAddress
        })
        const result = await contract.mint(ConnectionStore.getUserIdentity(), metaCID)
        result.issuedContractAddress = contractAddress
        return result
    }

    async sendNFT(tokenObject, toAddressPlain) {
        const {
            contractAddress,
            tokenID,
            fromAddress,
            toAddress
        } = await super.sendNFT(tokenObject, toAddressPlain)

        const Contract = new SmartContract({
            address: contractAddress
        })
        return await Contract.sendToken(tokenID, fromAddress, toAddress)
    }



    async getUserTokens({updateCache = false} = {}){}

    async getUserEffects({updateCache = false} = {}) {}

    /*  ----------  Actions ON  ----------  */

    /*
    * Apply effect to token
    * @param {object} token - common token object like {id (Number), address (0x...), identity, name, image, ?attributes, ?external_url}
    * @param {object} effect - common token object
    * @param {object} meta - {name, description, link}
    * @return {object} like {transactionResult, provider}
    * */

    /*
    * Make tokens bundle
    * @param {array} tokens - array of common token objects like {id (Number), address (0x...), identity, name, image, ?attributes, ?external_url}
    * @param {object} meta - {name, description, link}
    * @param {object} ?image - instance of Blob (File)
    * @return {object} like {transactionResult, provider}
    * */
    async makeTokensBundle({tokens, meta, image = null}){}

    async unwrap(tokenID) {}
}

export default Rarible