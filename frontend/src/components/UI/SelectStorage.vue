<template>
  <div class="select-storage">
    <div>
      Stored on:
    </div>
    <div>
      <select class="input" v-model="activeProvider">
        <option disabled>Choose collection</option>
        <option v-for="option of DecentralizedStorage.list" :key="option" :value="option" v-text="option"></option>
      </select>
    </div>
  </div>
</template>
<script setup>
    import {
        DecentralizedStorage,
    } from '@/crypto/helpers'
    import {computed} from "vue";

    const activeProvider = computed({
        get: () => DecentralizedStorage.provider,
        set: (v) => DecentralizedStorage.changeProvider(v)
    })
</script>