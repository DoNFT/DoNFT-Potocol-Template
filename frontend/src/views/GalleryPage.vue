<template>
  <Sketch class="gallery">
    <LoaderElement class="collections" v-if="isCollectionsLoading">Loading...</LoaderElement>
    <template v-else>

      <ContractElement
        v-for="collection in collections"
        :contract="collection"
        :byAvailable="true"
        :selectedTokens="selectedForBundle.identities"
        @chooseToken="chooseToken"
      />
    </template>
    <div
      class="gallery__center-btn btn"
      v-if="selectedForBundle.identities.length > 1"
      @click="makeBundle"
    >
      Make bundle
    </div>
  </Sketch>
  <PreviewToken/>
</template>

<script setup>
    import {storeToRefs} from "pinia";
    import Sketch from '@/components/UI/Sketch'
    import PreviewToken from '@/components/preview/Modal'
    import ContractElement from '@/components/gallery/Contract'
    import LoaderElement from '@/components/UI/Loader'

    import {useStore} from "@/store/main";
    // import AppConnector from "@/crypto/AppConnector";
    import {log} from "@/utils/AppLogger";
    // import {CollectionType} from "@/utils/collection";
    import {useRouter} from "vue-router";
    import {watch} from "vue";

    const store = useStore()

    const {
        isCollectionsLoading,
        collections,
        isBundleMode,
        selectedForBundle
    } = storeToRefs(store)

    watch(isBundleMode, (newState) => {
        if(!newState) store.cleanSavedTokensForBundle()
    })

    const chooseToken = async (token, contract) => {
        if(isBundleMode.value) store.toggleTokenForBundle(token)
        else{
            store.openPreview(token)
            try{
                // if(CollectionType.isBundle(contract.type)) {
                //     await AppConnector.connector.getWrappedTokensObjectList(token.contractAddress, token.id)
                // }
            }
            catch (e) {
                log(e);
            }
        }
    }

    const router = useRouter()

    const makeBundle = () => {
        store.saveMakeBundle()
        router.push({name: 'BundlePage'})
    }
</script>
