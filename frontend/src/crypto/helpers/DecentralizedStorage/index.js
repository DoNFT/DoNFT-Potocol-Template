import StorageBack from "./StorageBack";
import StorageSwarm from "./StorageSwarm";
import {ErrorList} from "@/crypto/helpers";
import {HTTP} from "@/utils/API";

export default {
    provider: localStorage.getItem('DecentralizedStorageProvider') || 'ipfs',
    list: ['ipfs', 'swarm'],
    async loadJSON(...args){
        return this.getProvider().loadJSON(...args)
    },
    async loadFile(...args){
        return this.getProvider().loadFile(...args)
    },
    async readData(url){
        try{
            let origin = typeof url === 'string' && url || ''
            if (!origin) throw Error(ErrorList.LOAD_MEDIA_ERROR)
            const storageInfo = {
                type: null,
                id: null
            }
            if(origin.includes('swarm')) storageInfo.type = 'swarm'
            else storageInfo.type = 'http'

            let meta = null

            if (storageInfo.type === 'http') {
                if(!origin.startsWith('ipfs://') && !origin.startsWith('http')) origin = 'ipfs://'+url

                let fetchURL = null
                if(origin.startsWith('ipfs://')) fetchURL = `https://ipfs.io/ipfs/${origin.replace('ipfs://', '')}`
                else if(origin.startsWith('http')) fetchURL = url
                if(!fetchURL) throw Error()

                const response = await HTTP.get(fetchURL, {headers: {'accept': 'application/json'}})
                if(response.headers['content-type'].indexOf('application/json') !== -1 && response.data) {
                    meta = response.data
                }
            }
            else if (storageInfo.type === 'swarm') {
                meta = StorageSwarm.readData(origin)
            }

            if (!meta) throw Error()

            return meta
        }
        catch (e) {
            throw Error(ErrorList.LOAD_MEDIA_ERROR)
        }
    },
    getProvider() {
        return this.provider === 'ipfs'? StorageBack : StorageSwarm
    },
    // @param type = 'swarm' || 'ipfs'
    changeProvider(type) {
        this.provider = type
        localStorage.setItem('DecentralizedStorageProvider', type)
    }
}