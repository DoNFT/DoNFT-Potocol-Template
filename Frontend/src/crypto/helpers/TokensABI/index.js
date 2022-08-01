import Bundle from './BundleNFT.json'
import ERC721 from './ERC721.json'

export default {
    bundle: {
        ABI: Bundle.abi,
        bytecode: Bundle.bytecode
    },
    effect: {
        ABI: ERC721.abi,
        bytecode: ERC721.bytecode
    },
    default: {
        ABI: ERC721.abi,
        bytecode: ERC721.bytecode
    }
}