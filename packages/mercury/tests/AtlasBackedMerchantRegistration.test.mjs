import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  assessDataForSeoEvidencePromotion,
  createMerchantIdentityReviewDecision,
  createProductIdentityReviewDecision,
  projectIdentityReviewState,
  resolveAtlasBackedMerchantRegistration
} from "../index.js";
import { RetailerRepository, validateRetailer } from "../../atlas/index.js";

const readJson = async (resource) => JSON.parse(await readFile(fileURLToPath(resource), "utf8"));
const retailerRepository = new RetailerRepository({ manifestUrl:new URL("../../atlas/atlas-manifest.json", import.meta.url), readJson });
const retailers = await retailerRepository.getAll();
const retailer = await retailerRepository.getById("RETAILER-0002");
assert.equal(validateRetailer(retailer).valid, true);
assert.equal(retailer.name, "Platinummicro");
assert.equal(new URL(retailer.websiteUrl).hostname, "platinummicro.com");

const candidate={candidateVersion:"1.0",candidateType:"MERCURY_MARKET_OBSERVATION",marketEvidence:{evidenceVersion:"1.0",provider:"DATAFORSEO",source:"DATAFORSEO_GOOGLE_SHOPPING",sourceMethod:"API",seller:{name:"Platinummicro",domain:"platinummicro.com",url:"https://platinummicro.com/item"},pricing:{basePrice:588.99,shippingPrice:null,tax:null,totalPrice:588.99,currency:"USD"},offer:{condition:null,details:"Corsair CMK32GX5M2B6000Z30",availability:"in_stock"},productEvidence:{title:"Corsair CMK32GX5M2B6000Z30",dataDocId:"3844868436216882408",productId:null,gid:null},provenance:{sourceTaskId:"sellers-task-e2i3",observedAt:"2026-08-21T16:31:45.604Z",rawPayloadReference:"fixture:e2i3"}},identity:{outcome:"PROBABLE",atlasProductId:"ram_corsair_cmk32gx5m2b6000z30",externalProductId:null,candidateAtlasProductIds:[],evidence:[]},governance:{requiresReview:true,canonicalObservationEligible:false,automaticPublicationEligible:false}};
const merchantResolution={resolutionVersion:"1.0",outcome:"DISCOVERED",retailerId:null,merchantKey:"domain:platinummicro.com",sellerName:"Platinummicro",canonicalDomain:"platinummicro.com",suppliedDomain:"platinummicro.com",urlDomain:"platinummicro.com",requiresRegistration:true,evidence:[],reason:"ATLAS_RETAILER_NOT_FOUND"};
const record={evidenceId:"dfev_e2i3_fixture",retainedAt:"2026-08-22T10:00:00Z",candidate,merchantResolution,eligibilityAtRetention:{eligibilityVersion:"1.0",status:"REVIEW_REQUIRED",canonicalObservationEligible:false,rawEvidenceRetentionEligible:true,historicalAnalyticsEligible:false,retailerId:null,requiresReview:true,reasons:["MERCHANT_REGISTRATION_REQUIRED"]}};
const evidenceBefore=structuredClone(record);
const audit={source:"OPERATOR_REVIEW",requestId:"merchant-review-platinummicro.com",preparedAt:"2026-08-22T10:02:00Z"};
const merchantDecision=createMerchantIdentityReviewDecision({identityReviewDecisionId:"mer_idrev_fixture_merchant",sequence:2,recordedAt:"2026-08-22T10:08:01Z",discoveredMerchantName:"Platinummicro",canonicalMerchantName:"Platinummicro",canonicalDomain:"platinummicro.com",merchantId:"RETAILER-0002",merchantActive:true,previousState:"DISCOVERED",requestedState:"REGISTERED",decisionOutcome:"APPROVED",reviewedAt:"2026-08-22T10:08:00Z",reviewedBy:"operator:fixture",reason:"Atlas retailer and retained merchant evidence reviewed.",supportingEvidenceReferences:[record.evidenceId],contradictionStatus:"NONE",audit});
const productDecision=createProductIdentityReviewDecision({identityReviewDecisionId:"mer_idrev_fixture_product",sequence:1,recordedAt:"2026-08-22T10:05:01Z",atlasProductId:candidate.identity.atlasProductId,previousState:"PROBABLE",requestedState:"VERIFIED",decisionOutcome:"APPROVED",reviewedAt:"2026-08-22T10:05:00Z",reviewedBy:"operator:fixture",reason:"Product identity reviewed.",supportingEvidenceReferences:[record.evidenceId],contradictionStatus:"NONE",audit:{...audit,requestId:"product-review-fixture"}});

const resolved=resolveAtlasBackedMerchantRegistration({decision:merchantDecision,record,retailers});
assert.equal(resolved.outcome,"RESOLVED");
assert.equal(resolved.retailerId,"RETAILER-0002");
assert.equal(resolved.canonicalDomain,"platinummicro.com");
const projection=projectIdentityReviewState({record,decisions:[productDecision,merchantDecision],atlasRetailers:retailers});
assert.equal(projection.product.state,"VERIFIED");
assert.equal(projection.merchant.state,"REGISTERED");
assert.equal(projection.merchant.atlasResolution.outcome,"RESOLVED");

assert.throws(()=>projectIdentityReviewState({record,decisions:[merchantDecision]}),/ATLAS_RETAILER_NOT_FOUND/);
const unknown={...merchantDecision,merchantId:"RETAILER-9999"};
assert.throws(()=>resolveAtlasBackedMerchantRegistration({decision:unknown,record,retailers}),/ATLAS_RETAILER_NOT_FOUND/);
const substituted={...merchantDecision,merchantId:"RETAILER-0001",canonicalMerchantName:"Amazon",canonicalDomain:"amazon.com"};
assert.throws(()=>resolveAtlasBackedMerchantRegistration({decision:substituted,record,retailers}),/EVIDENCE_DOMAIN_MISMATCH/);
assert.throws(()=>resolveAtlasBackedMerchantRegistration({decision:{...merchantDecision,canonicalDomain:"example.com"},record,retailers}),/DOMAIN_MISMATCH/);
assert.throws(()=>resolveAtlasBackedMerchantRegistration({decision:{...merchantDecision,canonicalMerchantName:"Different Merchant"},record,retailers}),/NAME_MISMATCH/);
assert.throws(()=>resolveAtlasBackedMerchantRegistration({decision:merchantDecision,record,retailers:retailers.map(x=>x.id==="RETAILER-0002"?{...x,status:"inactive"}:x)}),/NOT_ACTIVE/);

const withoutAtlas=assessDataForSeoEvidencePromotion({records:[record],identityReviewDecisions:[productDecision,merchantDecision]});
assert.equal(withoutAtlas.state,"BLOCKED");
assert.equal(withoutAtlas.historicalEligible,false);
const withAtlas=assessDataForSeoEvidencePromotion({records:[record],identityReviewDecisions:[productDecision,merchantDecision],atlasRetailers:retailers});
assert.equal(withAtlas.state,"HISTORICAL_ELIGIBLE");
assert.equal(withAtlas.productIdentity,"VERIFIED");
assert.equal(withAtlas.merchantIdentity,"REGISTERED");
assert.equal(withAtlas.historicalEligible,true);
assert.equal(withAtlas.canonicalEligible,false);
assert.equal(withAtlas.publicationEligible,false);
assert.ok(withAtlas.reasons.some(x=>x.code==="CANONICAL_PROMOTION_POLICY_MISSING"));
assert.deepEqual(record,evidenceBefore);
console.log("Atlas-backed merchant registration tests passed.");
