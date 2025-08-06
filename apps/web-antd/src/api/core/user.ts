import type { UserInfo } from '@vben/types';

import {baseRequestClient, requestClient} from '#/api/request';

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  return requestClient.get<UserInfo>('/user/info');
}
export interface TVCParams {
  grapari_id: string
  limit?: number
}

const transaction_id = "Q-1754299062-ID-1d0c8376-f969-47de-87be-40ad87b04853"
const x_signature = "20911537342d5713fa6ef836b0cc35b3"
export async function fetchWaiting(params,headers) {
  return baseRequestClient.get('https://grapari.telkomsel.com/api-be/systemq/v1/queue/grapari-total-queue?status=WAITING', {
    params,
    headers,
    withToken: false,
  })
}

  export async function fetchGraPARIDetail(params,headers) {
    return baseRequestClient.get('https://grapari.telkomsel.com/api-be/systemq/v1/grapari/detail', {
      params,
      headers,
      withToken: false,
    })
  }
export async function fetchTvcContent(params,headers) {
  return baseRequestClient.get('https://grapari.telkomsel.com/api-be/systemq/v1/grapari/tvc-content', {
    params,
    headers,
    withToken: false,
  })
}


/*export async function fetchTvcContent(params, headers) {
  return baseRequestClient.get('https://grapari.telkomsel.com/api-be/systemq/v1/grapari/tvc-content', {
    params,
    headers,
    withToken: false,
  });
}
*/
/*export async function fetchWaiting(params, headers) {
  return baseRequestClient.get('https://grapari.telkomsel.com/api-be/systemq/v1/queue/grapari-total-queue', {
    params,
    headers,
    withToken: false,
  });
}*/
