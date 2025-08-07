<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { BasicOption } from '@vben/types';

import {computed, markRaw, onMounted, reactive, ref} from 'vue';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { Col, Row, Button, Card, Divider, Tag, Statistic } from 'ant-design-vue';
import { useAuthStore } from '#/store';
import {fetchGraPARIDetail, fetchTvcContent, fetchWaiting} from "#/api/core";
import { useRoute } from 'vue-router';

const route = useRoute();
const grapariId = ref<string | null>(null);
const nearest_grapari = ref([]);
const grapariCards = ref<any[]>([]);

defineOptions({ name: 'Login' });
const location = ref(null);
const error = ref(null);
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
import {getGraPARIListApi} from "#/api";

const signatureStore = useSignatureStore();
const loading = ref(true)

async function fetchLocation() {
  try {
    const coords = await getCurrentLocation();
    location.value = coords;

    console.log(location)
  } catch (err) {
    if (err.code === 1) {
      error.value = 'User denied Geolocation access.';
    } else {
      error.value = err.message;
    }
    console.error('Error getting location:', err);
  }
}

// Fungsi getCurrentLocation() yang sama seperti di atas
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          resolve({ latitude, longitude });
        },
        (error) => {
          reject(error);
        }
      );
    } else {
      reject(new Error("Geolocation is not supported by this browser."));
    }
  });
}

async function getAntrian(grapari_id: string) {
  const headers = {
    'transaction-id': signatureStore?.transactionId,
    'x-signature': signatureStore?.xSignature,
    'channelid': 'a1',
    'api-key': 'abiXhVLnRe',
  };

  const result = await fetchTvcContent({ grapari_id, limit: 4 }, headers);
  const result_waiting = await fetchWaiting({ grapari_id, limit: 4 }, headers);
  const result_detailgra = await fetchGraPARIDetail({ grapari_id }, headers);

  return {
    grapari_id,
    serving: result.data,
    waiting: result_waiting.data,
    detail: result_detailgra.data,
  };
}
function mergeGrapariAndAntrian(grapariList, antrianList) {
  return grapariList.map((g, i) => ({
    ...antrianList[i],
    KODE: g.KODE,
    distance_km: g.distance_km,
    name: g.Name,
    alamat: g.Alamat,
  }));
}
async function fetchData() {
  loading.value = true;

  try {
    grapariId.value = route.query.id as string || null;
    const x = await getGraPARIListApi({ grapari_id: grapariId.value, limit: 5 });
    nearest_grapari.value = x.data;
    await signatureStore.fetchSignature();

    const grapariList = Array.isArray(x.data.data) ? x.data.data : [];

    const antrianResults = await Promise.all(
      grapariList.map((g) => getAntrian(g.KODE))
    );

    grapariCards.value = mergeGrapariAndAntrian(grapariList, antrianResults);
  } catch (err) {
    console.error("Gagal refresh data:", err);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await fetchData(); // Panggil pertama kali

  setInterval(async () => {
    await fetchData(); // Auto-refresh setiap 30 detik
  }, 10_000);
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
  <Row :gutter="16">
    <Col :xs="24" :sm="8" :md="8">
      <Card title="You Are Here | Anda Disini">
      <Card
        id="head-grapari"
        :title="grapariCards[0]?.detail?.grapari_detail?.grapari_name"
        :bordered="true"
        style="width: 100%; height: 100%; margin-bottom: 20px;"
        :loading="loading"
      >
        <template #extra>
          <Tag :color="checkOpen(grapariCards[0]?.detail?.grapari_detail) ? 'green' : 'red'">
            {{ checkOpen(grapariCards[0]?.detail?.grapari_detail) ? 'Buka' : 'Tutup' }}
          </Tag>
        </template>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <Statistic
              title="Menunggu"
              :value="grapariCards[0]?.waiting?.total_queue_waiting?.total_queue || 0"
              valueStyle="color: #3ff600"
              :suffix="grapariCards[0]?.waiting?.total_queue_waiting?.total_queue >= 1 ? 'Pelanggan' : ``"
            />
          </div>
          <div>
            <Statistic
              title="Sedang Dilayani"
              v-if="grapariCards[0]?.serving?.tvc_contents?.length >= 1"
              :value="grapariCards[0]?.serving?.tvc_contents?.length"
              valueStyle="color: rgb(52 204 204)"
              suffix="Pelanggan"
            />
            <span v-else>-</span>
          </div>
        </div>

        <Divider dashed>
          <strong>Alamat</strong>
        </Divider>
        <p>
          {{ grapariCards[0]?.detail?.grapari_detail?.address }}
        </p>

        <Divider dashed/>
        <div  style="font-size: x-small">
        <ul>
          <li>Senin–Jumat: {{ grapariCards[0]?.detail?.grapari_detail?.weekday_opening_operational_hour }} - {{ grapariCards[0]?.detail?.grapari_detail?.weekday_closing_operational_hour }}</li>
          <li>Sabtu: {{ grapariCards[0]?.detail?.grapari_detail?.saturday_opening_operational_hour }} - {{ grapariCards[0]?.detail?.grapari_detail?.saturday_closing_operational_hour }}</li>
          <li>Minggu: {{ grapariCards[0]?.detail?.grapari_detail?.sunday_opening_operational_hour }} - {{ grapariCards[0]?.detail?.grapari_detail?.sunday_closing_operational_hour }}</li>
        </ul>
        </div>
      </Card>
      </Card>
    </Col>

    <!-- Card sisanya di sebelah kanan -->
    <Col :xs="24" :sm="16" :md="16">
      <Row :gutter="12">
        <Col
          v-for="card in grapariCards.slice(1)"
          :key="card.grapari_id"
          :xs="24"
          :sm="12"
          :md="8"
        >
          <Card
            :title="card?.detail?.grapari_detail?.grapari_name"
            :bordered="false"
            style="width: 100%; margin-bottom: 20px"
            :loading="loading"
          >
            <template #extra>
              <Tag :color="checkOpen(card?.detail?.grapari_detail) ? 'green' : 'red'">
                {{ checkOpen(card?.detail?.grapari_detail) ? 'Buka' : 'Tutup' }}
              </Tag>

              {{ card?.distance_km?.toFixed(2) }} Km
            </template>


            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>

                <Statistic
                  title="Menunggu"
                  :value="card?.waiting?.total_queue_waiting?.total_queue || 0"
                  valueStyle="color: #3ff600"
                  :suffix="card?.waiting?.total_queue_waiting?.total_queue >= 1 ? 'Pelanggan' : ``"
                />
              </div>
              <div>
                <Statistic
                  title="Sedang Dilayani"
                  v-if="card?.serving?.tvc_contents?.length >= 1"
                  :value="card?.serving?.tvc_contents?.length"
                  valueStyle="color: rgb(52 204 204)"
                  suffix="Pelanggan"
                />
                <span v-else>-</span>
              </div>
            </div>

            <Divider dashed>
              <strong>Alamat</strong>
            </Divider>
            <p>
              {{ card?.detail?.grapari_detail?.address }}
<!--              <Button
                :href="`https://www.google.com/maps?q=${card?.detail?.grapari_detail?.latitude},${card?.detail?.grapari_detail?.longitude}`"
                target="_blank"
                rel="noopener"
              >
                📍 Buka di Google Maps
              </Button>-->
            </p>

            <Divider dashed/>
            <div  style="font-size: x-small">
            <ul>
              <li>Senin–Jumat: {{ card?.detail?.grapari_detail?.weekday_opening_operational_hour }} - {{ card?.detail?.grapari_detail?.weekday_closing_operational_hour }}</li>
              <li>Sabtu: {{ card?.detail?.grapari_detail?.saturday_opening_operational_hour }} - {{ card?.detail?.grapari_detail?.saturday_closing_operational_hour }}</li>
              <li>Minggu: {{ card?.detail?.grapari_detail?.sunday_opening_operational_hour }} - {{ card?.detail?.grapari_detail?.sunday_closing_operational_hour }}</li>
            </ul>
            </div>
          </Card>
        </Col>
      </Row>
    </Col>
  </Row>


</template>


<style>
div#head-grapari > .ant-card-head {
  background: #e81844;
}
</style>
