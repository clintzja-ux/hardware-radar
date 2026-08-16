import {
  DataForSeoMerchantApiClient,
  DataForSeoAcquisitionService,
  loadDataForSeoCredentials
} from "../packages/mercury/index.js";

const credentials = loadDataForSeoCredentials();

const transport = async ({ method, url, headers, body }) => {
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return data;
};

const client = new DataForSeoMerchantApiClient({
  login: credentials.login,
  password: credentials.password,
  transport
});

const acquisition = new DataForSeoAcquisitionService({
  client
});

const taskId = "08160208-2304-0455-0000-89fa5249cb5e";

const result = await acquisition.getProductInfoResult(taskId);

console.log("PRODUCT INFO RESULT RETRIEVED");
console.log("Task ID:", result.id);
console.log("Status:", result.status_code);
console.log("Status message:", result.status_message);
console.log("Cost USD:", result.cost ?? 0);

const resultBlock = result?.result?.[0] ?? null;

if (!resultBlock) {
  console.log("No result block returned.");
  process.exit(0);
}

const items = resultBlock?.items ?? [];

console.log("Items:", items.length);

for (const [index, item] of items.slice(0, 5).entries()) {
  console.log(`\n--- ITEM ${index + 1} ---`);
  console.log("Type:", item.type ?? null);
  console.log("Title:", item.title ?? null);
  console.log("Product ID:", item.product_id ?? null);
  console.log("Data Doc ID:", item.data_docid ?? null);
  console.log("GID:", item.gid ?? null);
  console.log("Description:", item.description ?? null);
  console.log("Brand:", item.brand ?? null);
  console.log("Sellers:", item.sellers ?? null);
  console.log("Specifications count:", item.specifications?.length ?? 0);

  if (Array.isArray(item.specifications)) {
    for (const spec of item.specifications.slice(0, 40)) {
      console.log(
        "SPEC:",
        spec.specification_name ?? null,
        "=",
        spec.specification_value ?? null
      );
    }
  }
}