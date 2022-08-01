<template>
  <div class="preview"
       v-if="preview.token"
       :class="[preview.isOpen? 'active':'close']"
       @click="close"
  >
    <div class="preview__content" @click.stop>
      <div class="preview__title">
        <div class="preview__close" @click="close">
          <svg viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.73633 13.5039C7.01462 13.7722 7.45776 13.7642 7.72611 13.4859C7.99447 13.2076 7.98641 12.7645 7.70812 12.4961L6.73633 13.5039ZM1 7L0.514105 6.49611C0.377288 6.62804 0.3 6.80994 0.3 7C0.3 7.19007 0.377288 7.37196 0.514105 7.50389L1 7ZM7.70812 1.50389C7.98641 1.23554 7.99447 0.792396 7.72611 0.514105C7.45776 0.235814 7.01462 0.227757 6.73633 0.496109L7.70812 1.50389ZM17 7.7C17.3866 7.7 17.7 7.3866 17.7 7C17.7 6.6134 17.3866 6.3 17 6.3L17 7.7ZM7.70812 12.4961L1.48589 6.49611L0.514105 7.50389L6.73633 13.5039L7.70812 12.4961ZM1.48589 7.50389L7.70812 1.50389L6.73633 0.496109L0.514105 6.49611L1.48589 7.50389ZM1 7.7L17 7.7L17 6.3L1 6.3L1 7.7Z"></path></svg>
        </div>
        <div v-text="title"></div>
        <div>
          <div class="prop">
            <span class="prop__name">
              Collection:
            </span>
            <span class="prop__value">
              <a target="_blank" :href="getExplorerLink('account', preview.token.contractAddress)" v-text="preview.token.contractAddress"></a>
              <a target="_blank" :href="getExplorerLink('account', preview.token.contractAddress)">
                <component :is="Icons.newTab" title="Open in explorer"/>
              </a>
              <CopyIcon :value="preview.token.contractAddress"/>
            </span>
          </div>
        </div>
      </div>
      <div class="preview__area"
        :class="{loading: isPreviewLoading}"
      >
        <div
          class="preview__token"
          :style="computeTokenImgStyle(preview.token.image)"
        ></div>
        <div
          class="preview__inside"
          v-if="CollectionType.isBundle(preview.contract.type)"
        >
          <div v-for="token in preview.token.inner">
            <div :style="computeTokenImgStyle(token.image)"></div>
            <div v-text="token.name"></div>
          </div>
        </div>
        <LoaderElement v-if="isPreviewLoading || (CollectionType.isBundle(preview.contract.type) && preview.token.innerLoading)" class="absolute with-bg"/>
      </div>
      <div class="preview__nav">
        <div class="btn"
             :class="{active: section === 'info'}"
             @click="changeSection('info')"
        >
          Info
        </div>
        <div class="btn"
             :class="{active: section === 'apply', na: !CollectionType.canApplyEffect(preview.contract.type)}"
             @click="CollectionType.canApplyEffect(preview.contract.type)? changeSection('apply') : null"
        >
          Apply effect
        </div>
        <div class="btn"
             :class="{active: section === 'send'}"
             @click="changeSection('send')"
        >
          Send
        </div>
        <div class="btn"
             v-if="CollectionType.isBundle(preview.contract.type)"
             @click="unwrap"
        >
          Unbundle
        </div>
        <a class="btn"
           v-if="marketPlaceLink"
           :href="marketPlaceLink"
           target="_blank"
        >
          View on Opensea
          <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><path d="M 25.980469 2.9902344 A 1.0001 1.0001 0 0 0 25.869141 3 L 20 3 A 1.0001 1.0001 0 1 0 20 5 L 23.585938 5 L 13.292969 15.292969 A 1.0001 1.0001 0 1 0 14.707031 16.707031 L 25 6.4140625 L 25 10 A 1.0001 1.0001 0 1 0 27 10 L 27 4.1269531 A 1.0001 1.0001 0 0 0 25.980469 2.9902344 z M 6 7 C 4.9069372 7 4 7.9069372 4 9 L 4 24 C 4 25.093063 4.9069372 26 6 26 L 21 26 C 22.093063 26 23 25.093063 23 24 L 23 14 L 23 11.421875 L 21 13.421875 L 21 16 L 21 24 L 6 24 L 6 9 L 14 9 L 16 9 L 16.578125 9 L 18.578125 7 L 16 7 L 14 7 L 6 7 z"></path></svg>
          </span>
        </a>
      </div>
      <div class="preview__section">
        <AddAssetSection v-if="section === 'apply'" @close="close"/>
        <SendSection v-else-if="section === 'send'" :token="preview.token" @close="close"/>
        <InfoSection v-else :token="preview.token"/>
      </div>
    </div>
  </div>
</template>

<script setup>
  import {useStore} from "@/store/main";
  import {storeToRefs} from "pinia";
  import {computeTokenImgStyle} from "@/utils/styles";
  import AddAssetSection from '@/components/preview/AddAssets'
  import InfoSection from '@/components/preview/Info'
  import SendSection from '@/components/preview/Send'
  import LoaderElement from '@/components/UI/Loader'
  import {computed, ref} from "vue";
  import Icons from "@/components/UI/icons";
  import CopyIcon from "@/components/UI/CopyIcon";
  import {CollectionType} from "@/utils/collection";
  import confirm from "@/utils/confirm";

  import {Networks, ConnectionStore, getErrorTextByCode} from "@/crypto/helpers"
  import AppConnector from "@/crypto/AppConnector";
  import TrnView from "@/utils/TrnView";
  import alert from "@/utils/alert";

  const store = useStore()
  const {
      preview,
      getExplorerLink
  } = storeToRefs(store);

  const title = computed(() => {
      const collectionName = CollectionType.getCollectionName(preview.value.contract.type)
      return `${collectionName}: ${preview.value.token.name}`
  })

  const section = ref('info')   // info, send, add
  const changeSection = (value) => {
      section.value = value
  }
  const isPreviewLoading = ref(false)

  const unwrap = () => {
      confirm.open(
          'Confirm unbundle?',
          async () => {
              try{
                  isPreviewLoading.value = true

                  const {transactionHash: hash} = await AppConnector.connector.unbundleToken(preview.value.token)

                  TrnView
                      .open({hash})
                      .onClose(async () => {
                          close()
                          await AppConnector.connector.fetchCollectionsWithTokens()
                      })
              }
              catch (e) {
                  alert.open(getErrorTextByCode(e.message) || e.message, 'Error:')
              }
              finally {
                  isPreviewLoading.value = false
              }
          }
      )
  }

  const marketPlaceLink = computed(() => {
      const {marketplaceExplorer} = Networks.getData(ConnectionStore.getNetwork().name)
      return marketplaceExplorer && marketplaceExplorer(...preview.value.token.identity.split(':')) || ''
  })

  const close = () => {
      store.closePreview()
  }
</script>
