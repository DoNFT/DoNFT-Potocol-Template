import {ErrorList} from '@/crypto/helpers'
import { Bee } from "@ethersphere/bee-js"

export default {
    bee: null,
    postageBatchId: '0000000000000000000000000000000000000000000000000000000000000000',
    getBee() {
        if (!this.bee) this.bee = new Bee('https://api.gateway.ethswarm.org')
        return this.bee
    },

    async save(file){
        const bee = this.getBee()
        const {reference} = await bee.uploadFile(this.postageBatchId, file)
        return `https://api.gateway.ethswarm.org/bzz/${reference}/`
    },

    /*
    * Put JSON to IPFS
    * @param {data} - js object
    * @return {string} cid
    * */
    async loadJSON(data = {}){
        try{
            const file = new File(
                [JSON.stringify(data)],
                "data.json",
                { type: "application/json" }
            )
            return await this.save(file)
        }
        catch (e){
            console.log('Error while loadingJSON to swarm', e)
            throw Error(ErrorList.LOAD_MEDIA_ERROR)
        }
    },

    /*
    * Put file to IPFS
    * @param {object} file - instance of Blob/File
    * @return {string} file_url
    * */
    async loadFile(file){
        try{
            return await this.save(file)
        }
        catch (e){
            console.log('Error while loadingJSON to swarm', e)
            throw Error(ErrorList.LOAD_MEDIA_ERROR)
        }
    },

    getIdFromURL(url){
        return url.split('/').find(p => p.length === 64)
    },

    async readData(url){
        const id = this.getIdFromURL(url)
        const bee = this.getBee()
        const {data, contentType} = await bee.downloadFile(id)
        if (contentType === 'application/json') return data.json()
        throw Error()
    }
}