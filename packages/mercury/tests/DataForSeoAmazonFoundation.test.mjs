import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SourceRightsRegistry, defaultSourceRightsRegistry, evaluateAcquisitionRight, createAmazonProductsEvidence, createAmazonAsinEvidence, createAmazonSellersEvidence, projectAmazonSellerToRetainedEvidence, assessAtlasAmazonAsinIdentity, AMAZON_ASIN_IDENTITY_STATES, FileDataForSeoMarketEvidenceRepository } from "../index.js";

let cases = 0;
const amazon = defaultSourceRightsRegistry.require("DATAFORSEO_AMAZON"), google = defaultSourceRightsRegistry.require("DATAFORSEO_GOOGLE_SHOPPING"), creators = defaultSourceRightsRegistry.require("AMAZON_CREATORS_API");
assert.notDeepEqual(amazon, google); assert.notDeepEqual(amazon, creators); assert.equal(amazon.retention.historical, "ALLOWED"); assert.equal(creators.retention.historical, "BLOCKED"); cases++;
const revoked = structuredClone(amazon); revoked.acquisition.api = "BLOCKED";
assert.equal(evaluateAcquisitionRight({ sourceMethod:"API", licenseContext:"DATAFORSEO_AMAZON" }, { registry:new SourceRightsRegistry({ sourceProfiles:{ DATAFORSEO_AMAZON:revoked } }) }).allowed, false); cases++;
assert.equal(evaluateAcquisitionRight({ sourceMethod:"API", licenseContext:"DATAFORSEO_GOOGLE_SHOPPING" }, { registry:new SourceRightsRegistry({ sourceProfiles:{ DATAFORSEO_AMAZON:amazon } }) }).allowed, false); cases++;

const products = createAmazonProductsEvidence({ data_asin:"B0ABC12345", title:"Corsair memory", url:"https://amazon.com/dp/B0ABC12345", price_range:{ min:50,max:60 }, currency:"USD", delivery:{ message:"Monday" }, special_offers:["coupon"] });
assert.equal(products.operation,"AMAZON_PRODUCTS"); assert.equal(products.dataAsin,"B0ABC12345"); cases++;
const asin = createAmazonAsinEvidence({ data_asin:"B0ABC12345", parent_asin:"B0PARENT12", product_asins:["B0CHILD123"], brand:"Corsair", details:{ capacityGb:32 }, currency:"USD" });
assert.equal(asin.operation,"AMAZON_ASIN"); assert.equal(asin.productAsins[0].dataAsin,"B0CHILD123"); cases++;
const missing = createAmazonSellersEvidence({ asin:"B0ABC12345", seller_name:"Amazon.com", seller_url:"https://amazon.com/sp", price:58.99, currency:"USD", condition:null, delivery_price:null });
assert.equal(missing.condition,null); assert.equal(missing.deliveryPrice,null); const missingProjection=projectAmazonSellerToRetainedEvidence(missing,{atlasProductId:"ram_fixture",sourceTaskId:"task-amz",observedAt:"2026-09-11T00:00:00Z",rawPayloadReference:"fixture:amazon:1"}); assert.equal(missingProjection.offer.condition,null); assert.equal(missingProjection.pricing.shippingPrice,null); assert.equal(missingProjection.pricing.tax,null); cases++;
const explicit = createAmazonSellersEvidence({ asin:"B0ABC12345", seller_name:"Amazon.com", price:58.99, regular_price:69.99, currency:"USD", condition:"new", condition_description:"New", delivery_price:0 });
assert.equal(explicit.condition,"new"); assert.equal(explicit.deliveryPrice,0); cases++;

const atlas={identity:{atlasProductId:"ram_fixture",manufacturerPartNumber:"CMK32GX4M2E3200C16",brand:"Corsair"},extension:{data:{capacity:{capacityGb:32,moduleCount:2},classification:{memoryType:"DDR4",formFactor:"DIMM"},performance:{dataRateMtps:3200,primaryTimings:"16-20-20-38"},physical:{color:"Black",rgbLighting:false}}}};
const good=(id="B0ABC12345",price=99)=>({dataAsin:id,title:"Corsair Vengeance LPX CMK32GX4M2E3200C16 32GB DDR4",brand:"Corsair",details:{capacityGb:32,moduleCount:2,memoryType:"DDR4",formFactor:"DIMM",dataRateMtps:3200,color:"Black",rgbLighting:false},price,sellerName:"irrelevant"});
let result=assessAtlasAmazonAsinIdentity({atlasProduct:atlas,candidates:[good()],corroboratingDestinationAsins:["B0ABC12345"]}); assert.equal(result.state,AMAZON_ASIN_IDENTITY_STATES.STRONG_UNIQUE_ASIN); assert.equal(result.providerAnchor.asin,"B0ABC12345"); cases++;
assert.equal(assessAtlasAmazonAsinIdentity({atlasProduct:atlas,candidates:[good("B0ABC12345"),good("B0XYZ98765")]}).state,AMAZON_ASIN_IDENTITY_STATES.MULTIPLE_COMPATIBLE_ASINS); cases++;
assert.equal(assessAtlasAmazonAsinIdentity({atlasProduct:atlas,candidates:[{...good(),details:{...good().details,capacityGb:64}}]}).state,AMAZON_ASIN_IDENTITY_STATES.ASIN_VARIANT_CONFLICT); cases++;
assert.equal(assessAtlasAmazonAsinIdentity({atlasProduct:atlas,candidates:[]}).state,AMAZON_ASIN_IDENTITY_STATES.ASIN_NOT_FOUND); cases++;
assert.equal(assessAtlasAmazonAsinIdentity({atlasProduct:atlas,candidates:[{...good(),title:`${good().title} bundle with motherboard`}]}).state,AMAZON_ASIN_IDENTITY_STATES.BUNDLE_ASIN); cases++;
assert.equal(assessAtlasAmazonAsinIdentity({atlasProduct:atlas,candidates:[{...good(),condition:"renewed"}]}).state,AMAZON_ASIN_IDENTITY_STATES.RENEWED_OR_USED_ASIN); cases++;
assert.equal(assessAtlasAmazonAsinIdentity({atlasProduct:atlas,candidates:[{dataAsin:"B0ABC12345",title:"Corsair RAM",brand:"Corsair"}]}).state,AMAZON_ASIN_IDENTITY_STATES.INSUFFICIENT_ASIN_EVIDENCE); cases++;
assert.equal(assessAtlasAmazonAsinIdentity({atlasProduct:atlas,candidates:[{...good(),title:"Corsair CMK32GX4M2E3200C16W 32GB DDR4"}]}).state,AMAZON_ASIN_IDENTITY_STATES.INSUFFICIENT_ASIN_EVIDENCE); cases++;
const neutralA=assessAtlasAmazonAsinIdentity({atlasProduct:atlas,candidates:[good("B0ABC12345",999),{...good("B0XYZ98765",1),details:{...good().details,capacityGb:64}}]}); const neutralB=assessAtlasAmazonAsinIdentity({atlasProduct:atlas,candidates:[{...good("B0XYZ98765",1),details:{...good().details,capacityGb:64}},good("B0ABC12345",999)]}); assert.equal(neutralA.assessmentId,neutralB.assessmentId); assert.equal(neutralA.priceConsidered,false); assert.equal(neutralA.sellerConsidered,false); cases++;

const root=await mkdtemp(join(tmpdir(),"h046-")); try { const repo=new FileDataForSeoMarketEvidenceRepository({statePath:join(root,"evidence.json"),now:()=>"2026-09-11T00:00:00Z"}), eligibility={rawEvidenceRetentionEligible:true}, merchant={outcome:"DISCOVERED"}; const make=(source,task)=>({candidateVersion:"1.0",candidateType:"MERCURY_MARKET_OBSERVATION",identity:{atlasProductId:"ram_fixture",outcome:"PROBABLE"},marketEvidence:{provider:"DATAFORSEO",source,sourceMethod:"API",seller:{name:"seller",domain:"amazon.com",url:"https://amazon.com/dp/B0ABC12345"},pricing:{basePrice:58.99,totalPrice:58.99,shippingPrice:null,tax:null,currency:"USD"},offer:{condition:null,availability:null},productEvidence:source==="DATAFORSEO_AMAZON"?{asin:"B0ABC12345"}:{productId:"p",dataDocId:null,gid:null},provenance:{sourceTaskId:task,rawPayloadReference:`fixture:${task}`,observedAt:"2026-09-11T00:00:00Z"}}}); await repo.retain({candidate:make("DATAFORSEO_GOOGLE_SHOPPING","g"),merchantResolution:merchant,eligibility}); await repo.retain({candidate:make("DATAFORSEO_AMAZON","a"),merchantResolution:merchant,eligibility}); const records=await repo.getAll(); assert.equal(records.length,2); assert.deepEqual(records.map(value=>value.candidate.marketEvidence.source).sort(),["DATAFORSEO_AMAZON","DATAFORSEO_GOOGLE_SHOPPING"]); cases++; } finally { await rm(root,{recursive:true,force:true}); }

console.log(`DataForSEO Amazon foundation tests passed: ${cases} cases.`);
