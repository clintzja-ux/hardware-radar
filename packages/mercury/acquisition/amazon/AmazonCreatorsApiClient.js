import { AMAZON_CREATORS_API_BASE_URL, AMAZON_US_MARKETPLACE, AMAZON_US_RESOURCES } from "./AmazonCreatorsApiConfig.js";
function retryAfter(error) { const n = Number(error?.retryAfterSeconds); return Number.isFinite(n) && n >= 0 ? n * 1000 : 1000; }
export class AmazonCreatorsApiClient {
  constructor({ tokenProvider, transport, rateGovernor, partnerTag, marketplace = AMAZON_US_MARKETPLACE, sleep = ms => new Promise(r=>setTimeout(r,ms)), maxRetries = 2 } = {}) {
    if (!tokenProvider || typeof transport !== "function" || !rateGovernor || !partnerTag) throw new TypeError("tokenProvider, transport, rateGovernor and partnerTag are required.");
    this.tokenProvider=tokenProvider; this.transport=transport; this.rateGovernor=rateGovernor; this.partnerTag=partnerTag; this.marketplace=marketplace; this.sleep=sleep; this.maxRetries=maxRetries;
  }
  async getItems(asins) {
    if (!Array.isArray(asins) || asins.length < 1 || asins.length > 10) throw new TypeError("GetItems requires 1-10 ASINs.");
    const body={ itemIds: asins, itemIdType:"ASIN", marketplace:this.marketplace, partnerTag:this.partnerTag, resources:[...AMAZON_US_RESOURCES] };
    for (let attempt=0;;attempt++) {
      await this.rateGovernor.acquire();
      const token=await this.tokenProvider.getAccessToken();
      try { return await this.transport({ method:"POST", url:`${AMAZON_CREATORS_API_BASE_URL}/catalog/v1/getItems`, headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json", "x-marketplace":this.marketplace }, body }); }
      catch (e) {
        if ((e?.status===401 || e?.code==="UNAUTHORIZED") && attempt < this.maxRetries) { this.tokenProvider.invalidate(); continue; }
        if ((e?.status===429 || e?.code==="ThrottleException" || (e?.status>=500 && e?.status<600)) && attempt < this.maxRetries) { await this.sleep(retryAfter(e)); continue; }
        throw e;
      }
    }
  }
}
export default AmazonCreatorsApiClient;
