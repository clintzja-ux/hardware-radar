import {
  DataForSeoMerchantApiClient,
  DataForSeoAcquisitionService,
  FileDataForSeoTaskLedger,
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

const ledger = new FileDataForSeoTaskLedger(
  ".forge-review/dataforseo-live/tasks.json"
);

const acquisition = new DataForSeoAcquisitionService({
  client,
  ledger
});

const result = await acquisition.createSellersTask({
  dataDocId: "17540895125310173539",
  locationName: "United States",
  languageName: "English"
});

console.log("SELLERS TASK CREATED");
console.log("Kind:", result.kind);
console.log("Task ID:", result.taskId);
console.log("Cost USD:", result.costUsd);
console.log("Status:", result.createdStatus);
console.log("Source:", result.sourceId);
