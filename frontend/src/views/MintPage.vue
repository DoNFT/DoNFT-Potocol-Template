<template>
  <Sketch class="token-page-cover">
    <div class="sketch__title">Create new NFT</div>
    <div class="token-page">
      <div class="token-page__media">
        <div class="token-page__img">
          <TokenMediaLoader ref="TokenMediaLoaderComponent"/>
        </div>
      </div>
      <div class="token-page__data">
        <SelectStorage/>
        <div class="token-page__field">
          <div>Collection</div>
          <div>
            <select class="input" v-model="contractAddress">
              <option :value="null" disabled>Choose collection</option>
              <option v-for="option in contractOptions" :key="option.address" :value="option.address" v-text="option.name"></option>
            </select>
          </div>
        </div>
        <div class="token-page__field">
          <div>Name*</div>
          <div>
            <input type="text" class="input" v-model.trim="meta.name">
          </div>
        </div>
        <div class="token-page__field">
          <div>External link</div>
          <div>
            <input type="text" class="input" v-model.trim="meta.link">
          </div>
        </div>
        <div class="token-page__field">
          <div>Description</div>
          <div>
            <input type="text" class="input" v-model.trim="meta.description">
          </div>
        </div>
      </div>
      <div></div>
      <div>
        <span
          class="btn"
          :class="{na: !isSubmitAvailable}"
          @click="isSubmitAvailable? mint() : null"
        >
          Create NFT
        </span>
      </div>
    </div>
    <PageBlockActionLoading v-if="isLoading"/>
  </Sketch>
</template>

<script setup>
    import Sketch from '@/components/UI/Sketch'
    import LoaderElement from '@/components/UI/Loader'
    import ToggleElement from '@/components/UI/Toggle'
    import PageBlockActionLoading from '@/components/UI/PageBlockActionLoading'

    import TokenMediaLoader from '@/components/UI/TokenMediaLoader'

    import {useStore} from "@/store/main";
    import {computed, onMounted, reactive, ref} from "vue";
    import AppConnector from "@/crypto/AppConnector";
    import {storeToRefs} from "pinia";
    import alert from "@/utils/alert";
    import {useRouter} from "vue-router";
    const router = useRouter()
    import TrnView from "@/utils/TrnView";
    import {getErrorTextByCode} from "@/crypto/helpers";
    import SelectStorage from '@/components/UI/SelectStorage'

    const store = useStore()
    const {

    } = storeToRefs(store);

    const isLoading = ref(false)

    const meta = reactive({
        name: '',
        link: '',
        description: '',
    })
    const contractAddress = ref('')
    const contractOptions = ref([])

    onMounted(async () => {
        const availableContracts = await AppConnector.connector.getAvailableContractsForCustomMint()
        if(availableContracts.length) {
            contractAddress.value = availableContracts[0].address
            contractOptions.value = availableContracts
        }
    })

    const TokenMediaLoaderComponent = ref(null)

    const isSubmitAvailable = computed(() => {
        return meta.name.trim().length && !isLoading.value && TokenMediaLoaderComponent.value.file && contractAddress.value.length
    })

    const mint = async () => {
        try{
            isLoading.value = true

            const {
                transactionHash: hash,
                issuedContractAddress
            } = await AppConnector.connector.createNewToken(meta, TokenMediaLoaderComponent.value.file, contractAddress.value)

            TrnView
                .open({hash})
                .onClose(() => {
                    console.log('contractsNeedToUpdate', [issuedContractAddress]);
                    router.push({name: 'Gallery'})
                    AppConnector.connector.updateContractTokensList([issuedContractAddress])
                })
        }
        catch (e) {
            console.log('Mint', e);
            alert.open(getErrorTextByCode(e.message) || e.message, 'Error:')
        }
        finally {
            isLoading.value = false
        }
    }
</script>
