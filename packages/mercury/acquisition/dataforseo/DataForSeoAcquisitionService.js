import crypto from "node:crypto";
import { evaluateAcquisitionRight } from "../../rights/SourceRightsEvaluator.js";
import { DATAFORSEO_SOURCE_ID } from "./DataForSeoConfig.js";
import { DataForSeoTaskLedger } from "./DataForSeoTaskLedger.js";

function key(kind, payload) { return crypto.createHash("sha256").update(JSON.stringify([DATAFORSEO_SOURCE_ID,kind,payload])).digest("hex"); }
function assertRights() { const r=evaluateAcquisitionRight({licenseContext:DATAFORSEO_SOURCE_ID,sourceMethod:"API"}); if (!r.allowed) throw new Error(`DATAFORSEO_SOURCE_RIGHTS_BLOCKED:${r.state}`); }

export class DataForSeoAcquisitionService {
  constructor({ client, ledger = new DataForSeoTaskLedger() }={}) { if (!client) throw new TypeError("client is required."); this.client=client; this.ledger=ledger; }
  async createProductsTask({ keyword, locationName="United States", languageName="English" }={}) {
    assertRights(); const payload={keyword,locationName,languageName}; const requestKey=key("PRODUCTS",payload); this.ledger.requireNew(requestKey);
    const task=await this.client.postProductsTask({keyword,locationName,languageName,tag:requestKey});
    return this.ledger.record(requestKey,{ kind:"PRODUCTS", taskId:task.id, costUsd:Number(task.cost ?? 0), createdStatus:task.status_code, sourceId:DATAFORSEO_SOURCE_ID });
  }
  async getProductsResult(taskId) { assertRights(); return this.client.getProductsResult(taskId); }
  async createProductInfoTask({ productId, locationName="United States", languageName="English" }={}) {
    assertRights(); const payload={productId,locationName,languageName}; const requestKey=key("PRODUCT_INFO",payload); this.ledger.requireNew(requestKey);
    const task=await this.client.postProductInfoTask({productId,locationName,languageName,tag:requestKey});
    return this.ledger.record(requestKey,{ kind:"PRODUCT_INFO", taskId:task.id, costUsd:Number(task.cost ?? 0), createdStatus:task.status_code, sourceId:DATAFORSEO_SOURCE_ID });
  }
  async getProductInfoResult(taskId) { assertRights(); return this.client.getProductInfoResult(taskId); }
  async createSellersTask({ productId, locationName="United States", languageName="English" }={}) {
    assertRights(); const payload={productId,locationName,languageName}; const requestKey=key("SELLERS",payload); this.ledger.requireNew(requestKey);
    const task=await this.client.postSellersTask({productId,locationName,languageName,tag:requestKey});
    return this.ledger.record(requestKey,{ kind:"SELLERS", taskId:task.id, costUsd:Number(task.cost ?? 0), createdStatus:task.status_code, sourceId:DATAFORSEO_SOURCE_ID });
  }
  async getSellersResult(taskId) { assertRights(); return this.client.getSellersResult(taskId); }
}
