import AppAPI, {HTTP} from "@/utils/API";
import ConnectionStore from "@/crypto/helpers/ConnectionStore";

export async function applyAssets(original, modifier){
    const sendBody = {
        original: {
            contract: original.contractAddress,
            tokenId: original.id,
            contentUrl: original.image
        },
        modificator: {
            contract: modifier.contractAddress,
            tokenId: modifier.id,
            contentUrl: modifier.image
        },
        sender: ConnectionStore.getUserIdentity()
    }

    const {headers, data: blobImage} = await AppAPI.post(
        '/effects/applyEffect',
        sendBody,
        {
            responseType: 'blob'
        }
    )

    return {
        url: `https://ipfs.io/${headers.contenturl.replace(':/', '')}`,
        blob: URL.createObjectURL(blobImage),
        cid: headers.contenturl.split('://').pop()
    }
}

export function transformIdentityToObject(identity){
    const [token, tokenId] = identity.split(':')
    return {token, tokenId}
}

export function transformIdentitiesToObjects(identitiesList){
    return identitiesList.map(transformIdentityToObject)
}

export function getCIDFromURL(url){
    return (url.split('/ipfs/').length > 1)? url.split('/ipfs/')[1] : url
}

export function computeModifyObject(token){
    return {
        contractAddress: token.contractAddress,
        tokenID: token.id,
        contentUrl: token.image,
    }
}