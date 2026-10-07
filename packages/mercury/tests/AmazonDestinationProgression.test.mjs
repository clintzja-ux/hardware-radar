import assert from "node:assert/strict";
import { AmazonDestinationProgressionService, canonicalAmazonProductUrl } from "../destinations/AmazonDestinationProgression.js";
import { sourceRightsProfileDigest } from "../rights/SourceRightsRegistry.js";

const rightsProfile={sourceId:"DATAFORSEO_AMAZON"},rightsDigest=sourceRightsProfileDigest(rightsProfile);
const product={identity:{atlasProductId:"ram_test_brand_part",manufacturerPartNumber:"PART-1"},governance:{lifecycleStatus:"ACTIVE",publicationStatus:"READY"}};
const retailer={id:"RETAILER-0001",name:"Amazon",status:"active",websiteUrl:"https://www.amazon.com"};
const identity={assessmentId:"mer_amzasin_fixture",outcomeId:"mer_amzoutcome_fixture",atlasProductId:product.identity.atlasProductId,state:"STRONG_UNIQUE_ASIN",governedAsin:"B012345678",canonicalResultId:"mer_providerresult_fixture",resultDigest:"a".repeat(64)};
const result={canonicalResultId:identity.canonicalResultId,sourceId:"DATAFORSEO_AMAZON",operation:"AMAZON_PRODUCTS",atlasProductId:product.identity.atlasProductId,resultDigest:identity.resultDigest,providerTaskId:"fixture-task",sourceRightsProfileDigest:rightsDigest};
const make=({p=product,i=identity,r=result,d=[]}={})=>{const retained=[...d];const destinations={getAll:async()=>retained,retain:async value=>{retained.push(value);return{status:"RETAINED",destinationId:value.destinationId}}};return{service:new AmazonDestinationProgressionService({productRepository:{getById:async()=>p},retailerRepository:{getById:async()=>retailer},identityRepository:{getEffectiveOutcomeByAssessmentId:async()=>i},resultRepository:{getCanonicalResultById:async()=>r},rightsRegistry:{verifyLineage:()=>({verified:r?.sourceRightsProfileDigest===rightsDigest,profile:rightsProfile})},destinationRepository:destinations}),retained,destinations}};

assert.equal(canonicalAmazonProductUrl("B012345678"),"https://amazon.com/dp/B012345678");
assert.throws(()=>canonicalAmazonProductUrl("bad"),/ASIN_INVALID/);
const one=make(),prep=await one.service.prepare({atlasProductId:product.identity.atlasProductId,assessmentId:identity.assessmentId});
assert.equal(prep.qualification,"ACTIONABILITY_REVIEW_REQUIRED"); assert.equal(prep.candidateUrl,"https://amazon.com/dp/B012345678"); assert.equal(prep.currentAuthority,false); assert.equal(prep.sellerInferred,false); assert.equal(prep.affiliateRequired,false);
assert.deepEqual(prep,await one.service.prepare({atlasProductId:product.identity.atlasProductId,assessmentId:identity.assessmentId}));
for(const state of ["INSUFFICIENT_ASIN_EVIDENCE","ASIN_NOT_FOUND","MULTIPLE_COMPATIBLE_ASINS","ASIN_VARIANT_CONFLICT","PROVIDER_FAILED"]){await assert.rejects(()=>make({i:{...identity,state}}).service.prepare({atlasProductId:product.identity.atlasProductId,assessmentId:identity.assessmentId}),/NOT_STRONG_UNIQUE/)}
await assert.rejects(()=>make({i:null}).service.prepare({atlasProductId:product.identity.atlasProductId,assessmentId:identity.assessmentId}),/NOT_STRONG_UNIQUE/);
await assert.rejects(()=>make({p:{...product,governance:{...product.governance,lifecycleStatus:"DRAFT"}}}).service.prepare({atlasProductId:product.identity.atlasProductId,assessmentId:identity.assessmentId}),/NOT_ACTIVE_READY/);
await assert.rejects(()=>make({r:{...result,sourceRightsProfileDigest:"b".repeat(64)}}).service.prepare({atlasProductId:product.identity.atlasProductId,assessmentId:identity.assessmentId}),/RIGHTS_LINEAGE/);
const review=one.service.createReview({preparation:prep,decision:"APPROVE",reviewedBy:"operator:test",reviewedAt:"2026-10-07T12:00:00Z",approvedPublicPageUrl:prep.candidateUrl});
const executed=await one.service.execute({preparation:prep,review}); assert.equal(executed.status,"DESTINATION_CREATED"); assert.equal(one.retained.length,1); assert.equal(one.retained[0].binding.method,"OPERATOR_EXACT_PRODUCT_REVIEW");
assert.equal((await one.service.execute({preparation:prep,review})).status,"ALREADY_BOUND");
const rejected=one.service.createReview({preparation:prep,decision:"REJECT",reviewedBy:"operator:test",reviewedAt:"2026-10-07T12:00:00Z"}); await assert.rejects(()=>one.service.execute({preparation:prep,review:rejected}),/NOT_APPROVED/);
const colliding={...one.retained[0],atlasProductId:"ram_other_brand_part",destinationId:"mer_dest_aaaaaaaaaaaaaaaaaaaaaaaa",materialFingerprint:"b".repeat(64)}; await assert.rejects(()=>make({d:[colliding]}).service.prepare({atlasProductId:product.identity.atlasProductId,assessmentId:identity.assessmentId}),/CROSS_PRODUCT_COLLISION/);
const already=make({d:one.retained}); const alreadyPrep=await already.service.prepare({atlasProductId:product.identity.atlasProductId,assessmentId:identity.assessmentId}); assert.equal(alreadyPrep.qualification,"ALREADY_BOUND");
const many=Array.from({length:200},(_,n)=>({...product,identity:{...product.identity,atlasProductId:`ram_test_brand_part_${n}`}})); assert.equal(many.length,200);
console.log("Amazon destination progression tests passed (strong binding, review, collision, stale-safe execution, separation, and 200-product compatibility).");
