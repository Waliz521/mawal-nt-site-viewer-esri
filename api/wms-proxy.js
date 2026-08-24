import { handleWmsProxy } from '../server/wms-proxy.mjs';

export default async function handler(req, res) {
  await handleWmsProxy(req, res);
}
