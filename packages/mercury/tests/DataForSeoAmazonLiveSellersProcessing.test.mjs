import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DataForSeoAmazonHistoricalRetentionService, FileDataForSeoMarketEvidenceRepository, assessDataForSeoEvidencePromotion, assessHistoricalOfferComparability, normalizeAmazonSellersResultRows } from "../index.js";

let cases = 0;
const asin = "B0CQQVNCB6", taskId = "amazon-sellers-live-shape", observedAt = "2026-09-13 03:18:10 +00:00";
const items = [
  { type:"amazon_seller_main_item", seller_name:null, seller_url:null, ships_from:null, price:null, percentage_discount:null, applicable_vouchers:null, rating:{value:4.5,votes_count:65}, condition:null, condition_description:null, delivery_info:null },
  { type:"amazon_seller_item", seller_name:"Newegg Business", seller_url:`http://amazon.com/gp/aag/main?seller=A3876XVCAXN576&asin=${asin}`, ships_from:"Newegg Business", price:{current:552.07,regular:null,currency:"USD"}, percentage_discount:null, applicable_vouchers:null, rating:{value:4.5,votes_count:531}, condition:"New", condition_description:null, delivery_info:{delivery_message:"FREE delivery September 18 - 24. Details",delivery_price:null} },
  { type:"amazon_seller_item", seller_name:"Amazon Japan", seller_url:`http://amazon.com/gp/aag/main?seller=A3GZEOQINOCL0Y&asin=${asin}`, ships_from:"Amazon Japan", price:{current:728.65,regular:null,currency:"USD"}, percentage_discount:null, applicable_vouchers:null, rating:null, condition:"New", condition_description:null, delivery_info:{delivery_message:"FREE delivery Monday, September 28. Details",delivery_price:null} }
];
const canonicalResult={sourceId:"DATAFORSEO_AMAZON",operation:"AMAZON_SELLERS",providerTaskId:taskId,canonicalResultId:"mer_providerresult_fixture",resultDigest:"d".repeat(64),sourceRightsProfileDigest:"r".repeat(64),retrievedAt:"2026-09-13T03:19:08.271Z",operationResult:{result:[{asin,datetime:observedAt,items}]}};
const normalized=normalizeAmazonSellersResultRows(canonicalResult);
assert.equal(normalized.length,3);assert.deepEqual(normalized.map(x=>x.sellerItem.dataAsin),[asin,asin,asin]);assert.deepEqual(normalized.map(x=>x.observedAt),[observedAt,observedAt,observedAt]);cases+=3;
assert.equal(normalized[0].sellerItem.currentPrice,null);assert.equal(normalized[0].sellerItem.condition,null);assert.equal(normalized[0].sellerItem.sellerRating.value,4.5);cases+=3;
assert.equal(normalized[1].sellerItem.currentPrice,552.07);assert.equal(normalized[1].sellerItem.currency,"USD");assert.equal(normalized[1].sellerItem.condition,"New");assert.equal(normalized[1].sellerItem.deliveryPrice,null);assert.match(normalized[1].sellerItem.delivery.delivery_message,/FREE delivery/);assert.equal(normalized[1].sellerItem.voucherTerms,null);assert.equal(normalized[1].sellerItem.percentageDiscount,null);cases+=7;
assert.equal(normalized[2].sellerItem.currentPrice,728.65);assert.equal(normalized[2].sellerItem.currency,"USD");assert.equal(normalized[2].sellerItem.condition,"New");assert.equal(normalized[2].sellerItem.deliveryPrice,null);cases+=4;
assert.throws(()=>normalizeAmazonSellersResultRows({...canonicalResult,operationResult:{result:[{asin,items:[{...items[1],data_asin:"B0OTHER001"}]}]}}),/SELLERS_ASIN_CONFLICT/);cases++;

const root=await mkdtemp(join(tmpdir(),"h054-"));
try{
  const evidenceRepository=new FileDataForSeoMarketEvidenceRepository({statePath:join(root,"evidence.json"),now:()=>"2026-09-13T03:20:00.000Z"}),retention=new DataForSeoAmazonHistoricalRetentionService({evidenceRepository}),identityAssessment={state:"STRONG_UNIQUE_ASIN",providerAnchor:{asin},productsTaskId:"amazon-products-task"},retained=[];
  for(const item of normalized)retained.push(await retention.retain({sellerItem:item.sellerItem,atlasProductId:"ram_fixture",identityAssessment,sellersTaskId:taskId,immutableResult:canonicalResult,observedAt:item.observedAt,rawPayloadReference:`dataforseo:amazon:sellers:${taskId}:item:${item.itemIndex}`}));
  assert.deepEqual(retained.map(x=>x.status),["RETAINED","RETAINED","RETAINED"]);cases++;
  const records=await evidenceRepository.getAll();assert.equal(records.length,3);assert.equal(records[0].candidate.marketEvidence.pricing.basePrice,null);assert.equal(records[0].candidate.marketEvidence.offer.condition,null);assert.equal(records[0].merchantResolution.outcome,"DISCOVERED");assert.equal(records[0].merchantResolution.canonicalDomain,null);cases+=5;
  for(const [index,price,name] of [[1,552.07,"Newegg Business"],[2,728.65,"Amazon Japan"]]){const evidence=records[index].candidate.marketEvidence;assert.equal(evidence.pricing.basePrice,price);assert.equal(evidence.pricing.totalPrice,price);assert.equal(evidence.pricing.shippingPrice,null);assert.equal(evidence.pricing.currency,"USD");assert.equal(evidence.offer.condition,"New");assert.match(evidence.offer.delivery.delivery_message,/FREE delivery/);assert.equal(records[index].merchantResolution.outcome,"DISCOVERED");assert.equal(records[index].merchantResolution.sellerName,name);assert.equal(records[index].merchantResolution.canonicalDomain,"amazon.com");assert.equal(assessHistoricalOfferComparability({record:records[index]}).classification,"UNKNOWN_COMPARABILITY");const promotion=assessDataForSeoEvidencePromotion({records:[records[index]],identityReviewDecisions:[],atlasRetailers:[]});assert.equal(promotion.historicalEligible,false);assert.equal(promotion.publicationEligible,false);cases+=12;}
  for(const item of normalized){const replay=await retention.retain({sellerItem:item.sellerItem,atlasProductId:"ram_fixture",identityAssessment,sellersTaskId:taskId,immutableResult:canonicalResult,observedAt:"2026-09-13T03:19:08.271Z",rawPayloadReference:`dataforseo:amazon:sellers:${taskId}:item:${item.itemIndex}`});assert.equal(replay.status,"DUPLICATE");}cases+=3;
  await assert.rejects(()=>retention.retain({sellerItem:{...normalized[1].sellerItem,currentPrice:553.07},atlasProductId:"ram_fixture",identityAssessment,sellersTaskId:taskId,immutableResult:canonicalResult,observedAt,rawPayloadReference:`dataforseo:amazon:sellers:${taskId}:item:1`}),/ACQUISITION_EVIDENCE_CONFLICT/);cases++;
  assert.equal(records.every(record=>record.candidate.marketEvidence.source==="DATAFORSEO_AMAZON"),true);assert.equal(records.every(record=>record.candidate.marketEvidence.source!=="DATAFORSEO_GOOGLE_SHOPPING"),true);cases+=2;
}finally{await rm(root,{recursive:true,force:true});}
console.log(`DataForSEO Amazon live Sellers processing tests passed: ${cases} cases.`);
