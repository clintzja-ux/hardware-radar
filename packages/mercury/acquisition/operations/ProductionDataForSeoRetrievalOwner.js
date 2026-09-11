import { DataForSeoMerchantApiClient } from "../dataforseo/DataForSeoMerchantApiClient.js";
import { DataForSeoAcquisitionService } from "../dataforseo/DataForSeoAcquisitionService.js";
import { loadDataForSeoCredentials } from "../dataforseo/DataForSeoConfig.js";

const METHODS = Object.freeze({ PRODUCTS: "getProductsResult", PRODUCT_INFO: "getProductInfoResult", SELLERS: "getSellersResult" });

const http = async ({ method, url, headers, body }) => {
  const response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return data;
};

export function createProductionDataForSeoRetrievalOwner({ operation, credentialLoader = loadDataForSeoCredentials, httpTransport, acquisitionService } = {}) {
  const method = METHODS[operation];
  if (!method) throw new TypeError("DATAFORSEO_RETRIEVAL_OPERATION_INVALID");
  const canonicalTransport = httpTransport ?? (operation === "PRODUCTS"
    ? async ({ method: requestMethod, url, headers, body }) => {
        const response = await fetch(url, { method: requestMethod, headers, body: body ? JSON.stringify(body) : undefined });
        const data = await response.json();
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return data;
      }
    : http);
  let service = acquisitionService ?? null;
  return Object.freeze({
    operation,
    async retrieve({ providerTaskId } = {}) {
      if (typeof providerTaskId !== "string" || !providerTaskId.trim()) throw new Error(`${operation}_TASK_ID_REQUIRED`);
      if (!service) {
        const credentials = credentialLoader();
        service = new DataForSeoAcquisitionService({ client: new DataForSeoMerchantApiClient({ login: credentials.login, password: credentials.password, transport: canonicalTransport }) });
      }
      const result = await service[method](providerTaskId.trim());
      return Object.freeze(structuredClone(result));
    }
  });
}
