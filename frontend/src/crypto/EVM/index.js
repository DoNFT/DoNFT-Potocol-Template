import {
    Networks,
    ConnectionStore,
    Formatters,
    AppStorage,
    Token,
    DecentralizedStorage,
    ActionTypes
} from '@/crypto/helpers'
import SmartContract from '@/crypto/EVM/SmartContract.js'
import {CollectionType} from "@/utils/collection";
import {stringCompare} from "@/utils/string";
import alert from "@/utils/alert";
import {ethers} from "ethers";
import {log} from "@/utils/AppLogger";

class EVM {

    constructor(){

    }


    /* ---------- Connected methods ON  ----------  */
    async init(){
        return await this.connector.init(this)
    }
    async connectToWallet(...data){
        return await this.connector.connectToWallet(...data)
    }
    async disconnect(){
        return await this.connector.disconnect()
    }
    async isUserConnected(){
        return await this.connector.isUserConnected()
    }
    /*  ----------  Connected methods OFF  ----------  */


    async fetchCollectionsWithTokens(){
        const storage = AppStorage.getStore()
        storage.changeCollectionLoadingState(true)

        const collections = []
        const whiteList = await this.getWhiteList({withUpdate: true})

        const bundles = await this._filterWhiteList(whiteList, CollectionType.BUNDLE)
        collections.push(...bundles)

        if(bundles[0] && bundles[0].address) {
            const tokens = await this._filterWhiteList(whiteList, CollectionType.TOKENS, bundles[0].address)
            collections.push(...tokens)
            const effects = await this._filterWhiteList(whiteList, CollectionType.EFFECT, bundles[0].address)
            collections.push(...effects)
        }

        storage.changeCollectionLoadingState(false)
        storage.setCollections(collections)
    }

    async getAvailableContractsForCustomMint() {
        const availableContracts = []
        const whiteList = await this.getWhiteList()
        const bundles = await this.getFromWhiteList(whiteList, CollectionType.BUNDLE)
        if(bundles[0] && bundles[0].contractAddress) {
            const tokens = await this.getFromWhiteList(whiteList, CollectionType.TOKENS, bundles[0].contractAddress)
            availableContracts.push(...tokens.map(contract => ({
                address: contract.contractAddress,
                name: 'Base tokens'
            })))
            const effects = await this.getFromWhiteList(whiteList, CollectionType.EFFECT, bundles[0].contractAddress)
            availableContracts.push(...effects.map(contract => ({
                address: contract.contractAddress,
                name: 'Style'
            })))
        }
        return availableContracts
    }

    async getFromWhiteList(list, contractType, originatedFor = null){
        return list.filter(contract => contract.type === contractType && ((originatedFor && stringCompare(contract.onlyFor, originatedFor)) || !originatedFor));
    }

    async _filterWhiteList(list, contractType, originatedFor = null){
        const filteredList = list.filter(contract => contract.type === contractType && ((originatedFor && stringCompare(contract.onlyFor, originatedFor)) || !originatedFor));
        const contracts = []
        for await (const contractPlain of filteredList){
            const contract = await this.getContractObject(contractPlain.contractAddress)
            contract.type = contractType
            contracts.push(contract)
        }
        return contracts
    }

    async getContractObject(address){
        const userIdentity = ConnectionStore.getUserIdentity()
        const contract = new SmartContract({
            address
        })
        const plainContract = await contract.getObjectForUser(userIdentity)
        let contractObject = Formatters.contractFormat(plainContract)
        contractObject.tokens = await this.addStructuresToTokenList(contractObject.tokens)
        return contractObject
    }

    async addStructuresToTokenList(tokenList){
        for await (const token of tokenList){
            token.structure = await this.getTokenStructure(token)
        }
        return tokenList
    }

    async getTokenStructure(tokenObject) {
        if(Array.isArray(tokenObject.structure) && tokenObject.structure.length) return tokenObject.structure
        let returnTokens = []

        try{
            returnTokens = await this.getWrappedTokensObjectList(tokenObject.contractAddress, tokenObject.id)
            for await (const token of returnTokens){
                token.structure = await this.getTokenStructure(token)
            }
        }
        catch (e){
            console.log('getTokenStructure error', e);
        }

        return returnTokens
    }

    whiteList = []
    async getWhiteList({withUpdate = false} = {}){
        if(!withUpdate && this.whiteList.length) return this.whiteList

        const {
            whiteListContract: address,
        } = Networks.getSettings(ConnectionStore.getNetwork().name)

        const contract = new SmartContract({
            address,
            type: CollectionType.WHITE_LIST
        })

        return this.whiteList = await contract.getWhiteList()
    }

    async getApplyEffectServerURLByContractAddress(contractAddress) {
        const whiteList = await this.getWhiteList()
        return whiteList.find(item => stringCompare(item.contractAddress, contractAddress))?.serverUrl
    }

    async getContractTokens(contractAddress){
        const contract = new SmartContract({
            address: contractAddress
        })
        return await contract.fetchTokensForUser(ConnectionStore.getUserIdentity())
    }

    async getWrappedTokensObjectList(contractAddress, tokenID){
        const contract = new SmartContract({
            address: contractAddress
        })
        const contractType = await contract.setCorrectContractType()
        if(contractType !== 'bundle') return []

        const wrappedTokens = await contract.getWrappedTokenList(tokenID)
        const wrappedTokenIdentities = wrappedTokens.map(token => `${token.contractAddress}:${token.tokenID}`)
        const tokenObjectList = await this.getTokenListByIdentity(wrappedTokenIdentities, false)

        tokenObjectList.forEach(token => {
            const findInPlain = wrappedTokens.find(t => stringCompare(token.identity, `${t.contractAddress}:${t.tokenID}`))
            token.tokenRole = findInPlain.role
        })

        return tokenObjectList
    }

    async getTokenListByIdentity(identityList){
        return await Promise.all(identityList.map(identity => this.getTokenByIdentity(identity)))
    }

    async getTokenByIdentity(identity){
        const [address, tokenID] = identity.split(':')
        const contract = new SmartContract({
            address
        })
        return await contract.getTokenById(tokenID)
    }






    async updateContractTokensList(list) {
        try{
            await Promise.all(list.map(address => this.updateContractTokens(address)))
        }
        catch (e) {
            console.log('updateContractTokensList', e);
        }
    }

    async updateContractTokens(contractAddress){
        const storage = AppStorage.getStore()
        try{
            storage.changeContractUpdating(contractAddress, true)
            let tokens = await this.getContractTokens(contractAddress)
            tokens = await this.addStructuresToTokenList(tokens)
            storage.updateContractTokens(contractAddress, tokens)
        }
        catch (e) {
            console.log('updateContractTokens', e);
        }
        finally {
            storage.changeContractUpdating(contractAddress, false)
        }
    }




    async mintTestToken(token){
        const cid = token[DecentralizedStorage.provider]
        const contract = new SmartContract({
            address: token.contractAddress
        })
        return await contract.mint(ConnectionStore.getUserIdentity(), cid)
    }

    async getContractTypeAddress(type = CollectionType.BUNDLE) {
        const whiteList = await this.getWhiteList()
        const contract = await this.getFromWhiteList(whiteList, type)
        if(contract.length && contract[0].contractAddress) return contract[0].contractAddress
        throw Error('ContractAddressNotFound')
    }

    async createBundle(meta, image, tokens){
        const storage = AppStorage.getStore()

        storage.setProcessStatus(ActionTypes.uploading_meta_data)
        const {
            metaCID
        } = await this.createTokenMeta(meta, image)

        const tokensList = Token.transformIdentitiesToObjects(tokens.map(t => t.identity))
        Token.addRole(tokensList)

        const contractAddress = this.getContractTypeAddress(CollectionType.BUNDLE)

        return {
            address: contractAddress,
            metaCID,
            tokensList
        }
    }

    async createTokenMeta(meta, image){
        const storage = AppStorage.getStore()

        storage.setProcessStatus(ActionTypes.uploading_media)
        meta.image = await DecentralizedStorage.loadFile(image)

        storage.setProcessStatus(ActionTypes.uploading_meta_data)
        const metaCID = await DecentralizedStorage.loadJSON(meta)

        return {
            metaCID
        }
    }

    async applyEffectToToken({name, link, description}, original, effect){
        const storage = AppStorage.getStore()

        storage.setProcessStatus(ActionTypes.generating_media)

        const serverURL = await this.getApplyEffectServerURLByContractAddress(effect.contractAddress)

        let {url: image, blob} = await Token.applyAssets(serverURL, original, effect)

        storage.setProcessStatus(ActionTypes.uploading_meta_data)
        const metaCID = await DecentralizedStorage.loadJSON({
            name,
            description,
            image,
            link
        })

        const computedTokenList = Token.transformIdentitiesToObjects([original.identity, effect.identity])
        Token.addRole(computedTokenList, {
            original: [original.identity],
            modifier: [effect.identity]
        })

        const whiteList = await this.getWhiteList()
        const bundles = await this._filterWhiteList(whiteList, CollectionType.BUNDLE)
        const contractAddress = (bundles[0] && bundles[0].address)? bundles[0].address : '0x00'

        return {
            resultTokenCID: metaCID,
            contractAddress,
            tokensList: computedTokenList,
            tempImage: blob,
            permanentImage: image
        }
    }





    async addTokensToBundle(tokenList){
        const addingTokenIdentities = tokenList.map(t => t.identity)
        const computedTokenList = Token.transformIdentitiesToObjects(addingTokenIdentities)
        computedTokenList.forEach(token => {
            token.role = Token.Roles.NoRole
        })

        return {
            addingTokenList: computedTokenList
        }
    }

    isRemoveFromBundleAllow(token){
        return !Token.Roles.nonRemoved.includes(token.role)
    }

    async removeAssetsFromBundle(tokenList){
        const addingTokenIdentities = tokenList.map(t => t.identity)
        const computedTokenList = Token.transformIdentitiesToObjects(addingTokenIdentities)
        computedTokenList.forEach(token => {
            token.role = Token.Roles.NoRole
        })
        return {
            removingTokens: computedTokenList
        }
    }





    async sendNFT(tokenObject, toAddressPlain) {
        const {realAddress: toAddress} = await this.checkForENSName(toAddressPlain)
        const [contractAddress, tokenID] = tokenObject.identity.split(':')
        const fromAddress = ConnectionStore.getUserIdentity()
        if(stringCompare(fromAddress, toAddress)) throw Error('THE_SAME_ADDRESS_ERROR')

        return {
            contractAddress,
            tokenID,
            fromAddress,
            toAddress
        }
    }


    async checkForENSName(address){
        if(ethers.utils.isAddress(address)){
            return {
                realAddress: address,
                ensName: address
            }
        }
        else{
            let realAddress;
            try{
                realAddress = await ConnectionStore.getProviderForENS().resolveName(address)
            }
            catch (e){
                log(e)
                throw new Error('CONTRACT_ADDRESS_ERROR')
            }
            if(realAddress && ethers.utils.isAddress(realAddress)){
                return {
                    realAddress: realAddress,
                    ensName: address
                }
            }
            else {
                throw new Error('CONTRACT_ADDRESS_ERROR')
            }
        }
    }

    tryToConnectToUnsupportedNetwork(){
        log('network not supported')
        alert.open('Sorry, we did not support this network')
    }

    async approve(tokenObject, toAddressPlain) {
        const {realAddress: forAddress} = await this.checkForENSName(toAddressPlain)
        const [contractAddress, tokenID] = tokenObject.identity.split(':')
        const fromAddress = ConnectionStore.getUserIdentity()
        if(stringCompare(fromAddress, forAddress)) throw Error('THE_SAME_ADDRESS_ERROR')

        const Contract = new SmartContract({
            address: contractAddress
        })
        const trnResult = await Contract.approve(forAddress, tokenID)
        if(!trnResult) throw Error('ALREADY_APPROVED')
        return trnResult
    }

    async isApproved(tokenObject){
        const [contractAddress, tokenID] = tokenObject.identity.split(':')
        const Contract = new SmartContract({
            address: contractAddress
        })
        const approvedFor = await Contract.getApproved(tokenID)
        return approvedFor && stringCompare(approvedFor, ConnectionStore.getUserIdentity())
    }
}

export default EVM