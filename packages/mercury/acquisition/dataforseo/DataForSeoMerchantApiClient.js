import { DATAFORSEO_API_BASE_URL, DATAFORSEO_DEFAULT_LANGUAGE, DATAFORSEO_DEFAULT_LOCATION, DATAFORSEO_NORMAL_PRIORITY } from "./DataForSeoConfig.js";

function required(value, name) { if (typeof value !== "string" || !value.trim()) throw new TypeError(`${name} is required.`); return value.trim(); }
function basic(login, password) { return `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`; }
function googleProductIdentity({ productId, dataDocId, gid }={}) {
  const identity = {};
  if (typeof productId === "string" && productId.trim()) identity.product_id = productId.trim();
  if (typeof dataDocId === "string" && dataDocId.trim()) identity.data_docid = dataDocId.trim();
  if (typeof gid === "string" && gid.trim()) identity.gid = gid.trim();
  if (Object.keys(identity).length === 0) throw new TypeError("One of productId, dataDocId, or gid is required.");
  return identity;
}
function firstTask(response) {
  if (response?.status_code !== 20000 || !Array.isArray(response.tasks) || !response.tasks[0]) throw new Error(`DATAFORSEO_API_ERROR:${response?.status_code ?? "UNKNOWN"}`);
  const task = response.tasks[0];
  if (task.status_code >= 40000) throw new Error(`DATAFORSEO_TASK_ERROR:${task.status_code}`);
  return task;
}

export class DataForSeoMerchantApiClient {
  constructor({ login, password, transport, baseUrl = DATAFORSEO_API_BASE_URL } = {}) {
    this.login=required(login,"login"); this.password=required(password,"password");
    if (typeof transport !== "function") throw new TypeError("transport is required.");
    this.transport=transport; this.baseUrl=baseUrl.replace(/\/$/,"");
  }
  headers() { return { Authorization: basic(this.login,this.password), "Content-Type":"application/json" }; }
  async postProductsTask({ keyword, locationName=DATAFORSEO_DEFAULT_LOCATION, languageName=DATAFORSEO_DEFAULT_LANGUAGE, tag, priority=DATAFORSEO_NORMAL_PRIORITY }={}) {
    required(keyword,"keyword"); if (priority !== 1) throw new Error("DATAFORSEO_HIGH_PRIORITY_BLOCKED");
    const body=[{ keyword:keyword.trim(), location_name:locationName, language_name:languageName, priority, ...(tag?{tag}: {}) }];
    return firstTask(await this.transport({ method:"POST", url:`${this.baseUrl}/v3/merchant/google/products/task_post`, headers:this.headers(), body }));
  }
  async getProductsResult(taskId) {
    required(taskId,"taskId");
    return firstTask(await this.transport({ method:"GET", url:`${this.baseUrl}/v3/merchant/google/products/task_get/advanced/${encodeURIComponent(taskId)}`, headers:this.headers() }));
  }
  async postSellersTask({ productId, dataDocId, gid, locationName=DATAFORSEO_DEFAULT_LOCATION, languageName=DATAFORSEO_DEFAULT_LANGUAGE, tag, priority=DATAFORSEO_NORMAL_PRIORITY }={}) {
    if (priority !== 1) throw new Error("DATAFORSEO_HIGH_PRIORITY_BLOCKED");
    const identity=googleProductIdentity({productId,dataDocId,gid});
    const body=[{ ...identity, location_name:locationName, language_name:languageName, priority, ...(tag?{tag}: {}) }];
    return firstTask(await this.transport({ method:"POST", url:`${this.baseUrl}/v3/merchant/google/sellers/task_post`, headers:this.headers(), body }));
  }
  async postProductInfoTask({ productId, dataDocId, gid, locationName=DATAFORSEO_DEFAULT_LOCATION, languageName=DATAFORSEO_DEFAULT_LANGUAGE, tag, priority=DATAFORSEO_NORMAL_PRIORITY }={}) {
    if (priority !== 1) throw new Error("DATAFORSEO_HIGH_PRIORITY_BLOCKED");
    const identity=googleProductIdentity({productId,dataDocId,gid});
    const body=[{ ...identity, location_name:locationName, language_name:languageName, priority, ...(tag?{tag}: {}) }];
    return firstTask(await this.transport({ method:"POST", url:`${this.baseUrl}/v3/merchant/google/product_info/task_post`, headers:this.headers(), body }));
  }
  async getProductInfoResult(taskId) {
    required(taskId,"taskId");
    return firstTask(await this.transport({ method:"GET", url:`${this.baseUrl}/v3/merchant/google/product_info/task_get/advanced/${encodeURIComponent(taskId)}`, headers:this.headers() }));
  }
  async getSellersResult(taskId) {
    required(taskId,"taskId");
    return firstTask(await this.transport({ method:"GET", url:`${this.baseUrl}/v3/merchant/google/sellers/task_get/advanced/${encodeURIComponent(taskId)}`, headers:this.headers() }));
  }
}
