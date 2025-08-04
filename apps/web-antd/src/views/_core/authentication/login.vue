<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { BasicOption } from '@vben/types';

import {computed, markRaw, onMounted, reactive} from 'vue';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { Card } from 'ant-design-vue';
import { useAuthStore } from '#/store';
import {fetchTvcContent, fetchWaiting} from "#/api/core";

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const data = reactive({
  serving : null,
  waiting : null
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

onMounted(async () => {
  await signatureStore.fetchSignature();
  const headers = {
    'transaction-id': signatureStore?.transactionId,
    'x-signature': signatureStore?.xSignature,
    'channelid': 'a1',
    'api-key': 'abiXhVLnRe',
  };

 const result = await fetchTvcContent(
    { grapari_id: '9b8fea0564d69c85', limit: 4 },
    headers,
  );

  const result_waiting = await fetchWaiting(
    { grapari_id: '9b8fea0564d69c85', limit: 4 },
    headers,
  );
  data.serving = result.data;
  data.waiting = result_waiting.data;
});

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
      <Card :title="data?.serving?.grapari_name" :bordered="false" style="width: 300px">
        <p>Serving : {{ data?.serving?.tvc_contents === null  ? 0 :  data?.serving?.tvc_contents?.length }}</p>
        <p>Waiting : {{ data?.waiting?.total_queue_waiting.total_queue === null  ? 0 :  data?.waiting?.total_queue_waiting.total_queue }}</p>
        <p>{{data.waiting }}</p>
      </Card>
  </div>
</template>
