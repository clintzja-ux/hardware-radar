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

const taskId = "08210233-2304-0179-0000-4ad9784a612c";

const result = await acquisition.getProductsResult(taskId);

console.log("PRODUCTS RESULT RETRIEVED");
console.log("Task ID:", result.id);
console.log("Status:", result.status_code);
console.log("Status message:", result.status_message);
console.log("Cost USD:", result.cost ?? 0);


const items = result?.result?.[0]?.items ?? [];

console.log("Items:", items.length);

for (const [index, item] of items.slice(0, 10).entries()) {
  console.log(`\n--- ITEM ${index + 1} ---`);
  console.log("Type:", item.type ?? null);
  console.log("Title:", item.title ?? null);
  console.log("Product ID:", item.product_id ?? null);
  console.log("Data Doc ID:", item.data_docid ?? null);
  console.log("GID:", item.gid ?? null);
  console.log("Domain:", item.domain ?? null);
  console.log("Seller:", item.seller_name ?? null);
  console.log("Price:", item.price ?? null);
  console.log("Currency:", item.currency ?? null);
  console.log("URL:", item.url ?? null);
  console.log("Shopping URL:", item.shopping_url ?? null);
  console.log("Description:", item.description ?? null);
}