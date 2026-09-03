function firstListing(item) { return item?.offersV2?.listings?.[0] ?? null; }
export class AmazonCreatorsAcquisitionService {
  constructor({ client, now = () => new Date().toISOString(), retrievedBy = "amazon-creators-api" } = {}) { if (!client) throw new TypeError("client is required."); this.client=client; this.now=now; this.retrievedBy=retrievedBy; }
  async acquire({ asin, atlasProductId }) {
    const response=await this.client.getItems([asin]);
    const item=response?.itemsResult?.items?.find(x=>x.asin===asin);
    const listing=firstListing(item);
    if (!item || !listing?.price?.money?.amount) return Object.freeze({ status:"NO_PUBLISHABLE_OFFER", asin });
    const retrievedAt=this.now();
    const sourcePayload={
      price: listing.price.money.amount, currency: listing.price.money.currency ?? "USD",
      availability: listing.availability?.type ?? "UNKNOWN", condition: String(listing.condition?.value ?? "NEW").toUpperCase(),
      sellerType: listing.merchantInfo?.name === "Amazon.com" ? "RETAILER" : "MARKETPLACE_SELLER",
      sourceUrl: item.detailPageURL, shipping:{costKnown:false,cost:null,currency:null,notes:null}, discount:null,
      affiliate:{isAffiliateLink:true,network:"AMAZON_ASSOCIATES",trackingCodePresent:true}
    };
    return Object.freeze({ status:"ACQUIRED", ingestionRequest:{ atlasProductId, retailerId:"RETAILER-0001", marketplace:"amazon.com", sourceMethod:"API", retrievedAt, retrievedBy:this.retrievedBy, requestId:response.requestId ?? null, retrievalSource:"Amazon Creators API GetItems OffersV2", sourceUri:item.detailPageURL, licenseContext:"AMAZON_CREATORS_API", sourcePayload } });
  }
}
export default AmazonCreatorsAcquisitionService;
