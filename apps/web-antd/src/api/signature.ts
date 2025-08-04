export interface SignatureResponse {
  'x-signature': string;
  'transaction-id': string;
}
import {baseRequestClient, requestClient} from '#/api/request'

export function getSignatureApi() {
  return baseRequestClient.get<{ message: string; data: SignatureResponse }>(
    'https://backend.tsel.my.id/signature'
  );
}
