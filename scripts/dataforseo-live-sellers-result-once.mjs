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

const taskId = "08211631-2304-0183-0000-2f47e4410471";
const result = await acquisition.getSellersResult(taskId);

console.log("SELLERS RESULT RETRIEVED");
console.log("Task ID:", result.id);
console.log("Status:", result.status_code);
console.log("Status message:", result.status_message);
console.log("Cost USD:", result.cost ?? 0);

const resultBlock = result?.result?.[0] ?? null;

if (!resultBlock) {
  console.log("No result block returned.");
  process.exit(0);
}

console.log("Title:", resultBlock.title ?? null);
console.log("Product ID:", resultBlock.product_id ?? null);
console.log("Data Doc ID:", resultBlock.data_docid ?? null);
console.log("GID:", resultBlock.gid ?? null);

const items = resultBlock?.items ?? [];

console.log("Seller items:", items.length);

for (const [index, item] of items.slice(0, 20).entries()) {
  console.log(`\n--- SELLER ${index + 1} ---`);

  console.log("Type:", item.type ?? null);
  console.log("Seller name:", item.seller_name ?? null);
  console.log("Title:", item.title ?? null);
  console.log("Domain:", item.domain ?? null);
  console.log("URL:", item.url ?? null);

  console.log("Base price:", item.base_price ?? null);
  console.log("Tax:", item.tax ?? null);
  console.log("Shipping price:", item.shipping_price ?? null);
  console.log("Total price:", item.total_price ?? null);
  console.log("Currency:", item.currency ?? null);

  console.log("Condition:", item.product_condition ?? null);
  console.log("Details:", item.details ?? null);

  console.log(
    "Rating:",
    item.rating?.value ?? null
  );

  console.log(
    "Rating votes:",
    item.rating?.votes_count ?? null
  );

  console.log(
    "Shop ad click token present:",
    Boolean(item.shop_ad_aclk)
  );
}