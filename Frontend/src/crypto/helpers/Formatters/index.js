import {CollectionType} from "@/utils/collection";
import {ConnectionStore, Networks} from "@/crypto/helpers";
import {stringCompare} from "@/utils/string";

export function contractFormat({
   address,
   tokens = [],
   name = null,
   symbol = null,
   type = CollectionType.NONE
}){

    const {
        bundleContract,
        effectsContract
    } = Networks.getSettings(ConnectionStore.getNetwork().name)

    let contractName = name || address
    if(stringCompare(address, bundleContract)) contractName = `[Bundle] ${contractName}`
    else if(stringCompare(address, effectsContract)) contractName = `[Effect] ${contractName}`

    return {
        address,
        name: contractName,
        symbol: symbol || '',
        tokens,
        isUpdating: false,
        type
   }
}

export function tokenFormat({
    id,
    contractAddress,
    name = null,
    image = null,
    description = null,
    link = null
}){
   if(image && image.startsWith('ipfs://ipfs/')) image = image.replace('ipfs://', 'https://ipfs.io/')

    const fieldsForView = []
    fieldsForView.push({key: 'name', value: name || id})
    if(description) fieldsForView.push({key: 'description', value: description})
    if(link) fieldsForView.push({key: 'link', value: link})

    return {
        id,
        contractAddress,
        identity: `${contractAddress}:${id}`,
        name: name || id,
        image,
        description,
        link,
        fieldsForView,
        inner: [],
        innerLoading: false
   }
}