import { ref } from 'vue';
import { defineStore } from 'pinia';

import { getSignatureApi } from '#/api';

export const useSignatureStore = defineStore('signature', () => {
  const xSignature = ref('');
  const transactionId = ref('');
  const loading = ref(false);

  async function fetchSignature() {
    loading.value = true;
    try {
      const res = await getSignatureApi();
      console.log(res)
      if (res?.data?.data['x-signature'] && res?.data?.data['transaction-id']) {
        xSignature.value = res.data.data['x-signature'];
        transactionId.value = res.data.data['transaction-id'];
      } else {
        console.warn('Signature response tidak lengkap.');
      }
    } catch (error) {
      console.error('Gagal mengambil signature:', error);
    } finally {
      loading.value = false;
    }
  }

  function $reset() {
    xSignature.value = '';
    transactionId.value = '';
    loading.value = false;
  }

  return {
    xSignature,
    transactionId,
    loading,
    fetchSignature,
    $reset,
  };
}, {
  persist: true,
});
