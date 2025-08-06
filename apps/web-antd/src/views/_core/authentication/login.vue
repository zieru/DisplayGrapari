<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { BasicOption } from '@vben/types';

import {computed, markRaw, onMounted, reactive, ref} from 'vue';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { Button, Card, Divider, Tag, Statistic } from 'ant-design-vue';
import { useAuthStore } from '#/store';
import {fetchGraPARIDetail, fetchTvcContent, fetchWaiting} from "#/api/core";

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const data = reactive({
  serving : null,
  waiting : null,
  detail : null
});
const MOCK_USER_OPTIONS: BasicOption[] = [
  {
    label: 'Super',
    value: 'vben',
  },
  {
    label: 'Admin',
    value: 'admin',
  },
  {
    label: 'User',
    value: 'jack',
  },
];

import { useSignatureStore } from '#/store/signature';

const signatureStore = useSignatureStore();
const loading = ref(true)

onMounted(async () => {
  await signatureStore.fetchSignature();
  const headers = {
    'transaction-id': signatureStore?.transactionId,
    'x-signature': signatureStore?.xSignature,
    'channelid': 'a1',
    'api-key': 'abiXhVLnRe',
  };

  try {
    loading.value = true
    const result = await fetchTvcContent(
      { grapari_id: '9b8fea0564d69c85', limit: 4 },
      headers,
    );

    const result_waiting = await fetchWaiting(
      { grapari_id: '9b8fea0564d69c85', limit: 4 },
      headers,
    );
    const result_detailgra = await fetchGraPARIDetail(
      { grapari_id: '9b8fea0564d69c85', limit: 4 },
      headers,
    );
    data.serving = result.data;
    data.waiting = result_waiting.data;
    data.detail = result_detailgra.data;

  } finally {
    loading.value = false
  }

});
function checkOpen(grapari) {
  const now = new Date();
  const currentDay = now.getDay(); // 0: Minggu, 1: Senin, ..., 6: Sabtu
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

  if (!grapari) return false;

  let open = '';
  let close = '';

  if (currentDay === 0) {
    open = grapari.sunday_opening_operational_hour;
    close = grapari.sunday_closing_operational_hour;
  } else if (currentDay === 6) {
    open = grapari.saturday_opening_operational_hour;
    close = grapari.saturday_closing_operational_hour;
  } else {
    open = grapari.weekday_opening_operational_hour;
    close = grapari.weekday_closing_operational_hour;
  }

  return currentTime >= open && currentTime <= close;
}
const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenSelect',
      componentProps: {
        options: MOCK_USER_OPTIONS,
        placeholder: $t('authentication.selectAccount'),
      },
      fieldName: 'selectAccount',
      label: $t('authentication.selectAccount'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.selectAccount') })
        .optional()
        .default('vben'),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      dependencies: {
        trigger(values, form) {
          if (values.selectAccount) {
            const findUser = MOCK_USER_OPTIONS.find(
              (item) => item.value === values.selectAccount,
            );
            if (findUser) {
              form.setValues({
                password: '123456',
                username: findUser.value,
              });
            }
          }
        },
        triggerFields: ['selectAccount'],
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: markRaw(SliderCaptcha),
      fieldName: 'captcha',
      rules: z.boolean().refine((value) => value, {
        message: $t('authentication.verifyRequiredTip'),
      }),
    },
  ];
});
</script>

<template>
  <div style="margin-top: 10px">
    <Card
      :title="data?.detail?.grapari_detail?.grapari_name"
      :bordered="false"
      style="width: 100%; max-width: 400px"
      v-if="data?.detail?.grapari_detail?.grapari_name"
      :loading="loading"
    >
      <template #extra>
        <Tag :color="checkOpen(data?.detail?.grapari_detail) ? 'green' : 'red'">
          {{ checkOpen(data?.detail?.grapari_detail) ? 'Buka' : 'Tutup' }}
        </Tag>
      </template>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <Statistic
            title="Menunggu"
            :value="data?.waiting?.total_queue_waiting?.total_queue <= 0 ? `` : data?.waiting?.total_queue_waiting?.total_queue"
            valueStyle="color: #3ff600"
            :suffix="data?.waiting?.total_queue_waiting?.total_queue >= 1 ? 'Pelanggan' : ``"
          />
        </div>
        <div>
          <Statistic
            title="Sedang Dilayani"
            v-if="data?.serving?.tvc_contents?.length >= 1"
            :value="data?.serving?.tvc_contents?.length <= 0 ? `` : data?.serving?.tvc_contents?.length"
            valueStyle="color: rgb(52 204 204)"
            :suffix="data?.serving?.tvc_contents?.length >= 1 ? 'Pelanggan' : ``"
          />
          <span v-else> - </span>
        </div>
      </div>


      <Divider dashed>
        <strong>Alamat</strong>
      </Divider>
      <p>{{ data.detail?.grapari_detail?.address }}   <Button
        :href="`https://www.google.com/maps?q=${data.detail?.grapari_detail?.latitude},${data.detail?.grapari_detail?.longitude}`"
        target="_blank"
        rel="noopener"
      >
        📍 Buka di Google Maps
      </Button></p>
      <Divider dashed>
        <strong>Jam Operasional:</strong>
      </Divider>
      <ul>
        <li>Senin–Jumat: {{ data.detail?.grapari_detail?.weekday_opening_operational_hour }} - {{ data.detail?.grapari_detail?.weekday_closing_operational_hour }}</li>
        <li>Sabtu: {{ data.detail?.grapari_detail?.saturday_opening_operational_hour }} - {{ data.detail?.grapari_detail?.saturday_closing_operational_hour }}</li>
        <li>Minggu: {{ data.detail?.grapari_detail?.sunday_opening_operational_hour }} - {{ data.detail?.grapari_detail?.sunday_closing_operational_hour }}</li>
      </ul>

    </Card>


  </div>
</template>
