import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {execFileSync} from "node:child_process";
import {
  FileDataForSeoMarketEvidenceRepository,FileIdentityReviewDecisionRepository,IdentityReviewService,
  createProductIdentityReviewDecision,createMerchantIdentityReviewDecision,projectIdentityReviewState,
  assessDataForSeoEvidencePromotion,prepareProductIdentityReview,prepareMerchantIdentityReview
} from "../index.js";

const candidate={candidateVersion:"1.0",candidateType:"MERCURY_MARKET_OBSERVATION",marketEvidence:{evidenceVersion:"1.0",provider:"DATAFORSEO",source:"DATAFORSEO_GOOGLE_SHOPPING",sourceMethod:"API",seller:{name:"Platinummicro",domain:"platinummicro.com",url:"https://platinummicro.com/item"},pricing:{basePrice:588.99,shippingPrice:null,tax:null,totalPrice:588.99,currency:"USD"},offer:{condition:null,details:"Corsair CMK32GX5M2B6000Z30",availability:"in_stock"},productEvidence:{title:"Corsair CMK32GX5M2B6000Z30",dataDocId:"3844868436216882408",productId:null,gid:null},provenance:{sourceTaskId:"sellers-task-1",observedAt:"2026-08-21T16:31:45.604Z",rawPayloadReference:"fixture:e2i"}},identity:{outcome:"PROBABLE",atlasProductId:"ram_corsair_cmk32gx5m2b6000z30",externalProductId:null,candidateAtlasProductIds:[],evidence:[{field:"brand",status:"MATCH"}]},governance:{requiresReview:true,canonicalObservationEligible:false,automaticPublicationEligible:false}};
const merchant={resolutionVersion:"1.0",outcome:"DISCOVERED",retailerId:null,merchantKey:"domain:platinummicro.com",sellerName:"Platinummicro",canonicalDomain:"platinummicro.com",suppliedDomain:"platinummicro.com",urlDomain:"platinummicro.com",requiresRegistration:true,evidence:[],reason:"ATLAS_RETAILER_NOT_FOUND"};
const eligibility={eligibilityVersion:"1.0",status:"REVIEW_REQUIRED",canonicalObservationEligible:false,rawEvidenceRetentionEligible:true,historicalAnalyticsEligible:false,retailerId:null,requiresReview:true,reasons:["MERCHANT_REGISTRATION_REQUIRED"]};
const atlasRetailers=[{id:"RETAILER-0002",name:"Platinummicro",slug:"platinummicro",websiteUrl:"https://platinummicro.com",status:"active",regions:["US"],supportedCurrencies:["USD"],affiliateProgram:{available:false,status:"unknown",network:null,disclosureRequired:true},metadata:{createdAt:"2026-08-23T00:00:00Z",updatedAt:"2026-08-23T00:00:00Z",sourceReferences:["Platinummicro"]}}];
const root=await mkdtemp(join(tmpdir(),"hardware-radar-e2i-"));
try{
  const evidenceRepository=new FileDataForSeoMarketEvidenceRepository({statePath:join(root,"evidence.json"),now:()=>"2026-08-22T10:00:00Z"});
  const retained=await evidenceRepository.retain({candidate,merchantResolution:merchant,eligibility});
  const record=await evidenceRepository.getById(retained.evidenceId);const original=structuredClone(record);
  const decisionRepository=new FileIdentityReviewDecisionRepository({statePath:join(root,"identity-reviews.json"),now:()=>"2026-08-22T10:10:00Z"});
  const service=new IdentityReviewService({evidenceRepository,decisionRepository});
  const audit={source:"OPERATOR_REVIEW",requestId:"req-product-1",preparedAt:"2026-08-22T10:01:00Z"};

  const baseline=assessDataForSeoEvidencePromotion({records:[record]});assert.equal(baseline.state,"REVIEW_REQUIRED");
  assert.equal(assessDataForSeoEvidencePromotion({records:[record],identityReviewDecisions:[{subjectType:"PRODUCT_IDENTITY"}]}).state,"BLOCKED");
  const productRequest=prepareProductIdentityReview({records:[record],atlasProductId:candidate.identity.atlasProductId,preparedAt:audit.preparedAt,requestId:audit.requestId});assert.equal(productRequest.status,"PENDING_OPERATOR_REVIEW");
  const product=await service.recordProductDecision({atlasProductId:candidate.identity.atlasProductId,previousState:"PROBABLE",requestedState:"VERIFIED",decisionOutcome:"APPROVED",reviewedAt:"2026-08-22T10:05:00Z",reviewedBy:"operator:test",reason:"MPN and physical specifications reviewed.",supportingEvidenceReferences:[record.evidenceId],contradictionStatus:"NONE",audit});
  assert.equal(product.identityReviewDecisionId,"mer_idrev_000000001");assert.equal(product.requestedState,"VERIFIED");
  assert.throws(()=>createProductIdentityReviewDecision({...product,identityReviewDecisionId:undefined,sequence:undefined,recordedAt:undefined,requestedState:"REGISTERED"}),/Only PROBABLE to VERIFIED/);
  assert.throws(()=>createProductIdentityReviewDecision({...product,identityReviewDecisionId:undefined,sequence:undefined,recordedAt:undefined,contradictionStatus:"CRITICAL"}),/contradictions block/);
  assert.deepEqual(await evidenceRepository.getById(record.evidenceId),original);
  const productOnly=projectIdentityReviewState({record,decisions:[product]});assert.equal(productOnly.product.state,"VERIFIED");assert.equal(productOnly.merchant.state,"DISCOVERED");
  assert.equal(assessDataForSeoEvidencePromotion({records:[record],identityReviewDecisions:[product]}).state,"REVIEW_REQUIRED");

  const rejected=await service.recordMerchantDecision({discoveredMerchantName:"Platinummicro",canonicalMerchantName:"Platinummicro",canonicalDomain:"platinummicro.com",merchantId:"RETAILER-PLATINUMMICRO",merchantActive:true,previousState:"DISCOVERED",requestedState:"REGISTERED",decisionOutcome:"REJECTED",reviewedAt:"2026-08-22T10:06:00Z",reviewedBy:"operator:test",reason:"Registration evidence needs confirmation.",supportingEvidenceReferences:[record.evidenceId],contradictionStatus:"NONE",audit:{source:"OPERATOR_REVIEW",requestId:"req-merchant-reject",preparedAt:"2026-08-22T10:02:00Z"}});
  assert.equal(projectIdentityReviewState({record,decisions:[rejected]}).merchant.state,"DISCOVERED");
  assert.throws(()=>createMerchantIdentityReviewDecision({...rejected,identityReviewDecisionId:undefined,sequence:undefined,recordedAt:undefined,canonicalDomain:"not a domain"}),/canonicalDomain/);
  assert.throws(()=>createMerchantIdentityReviewDecision({...rejected,identityReviewDecisionId:undefined,sequence:undefined,recordedAt:undefined,previousState:"REGISTERED"}),/Only DISCOVERED to REGISTERED/);

  const merchantRequest=prepareMerchantIdentityReview({records:[record],canonicalDomain:"platinummicro.com",canonicalMerchantName:"Platinummicro",merchantId:"RETAILER-0002",preparedAt:"2026-08-22T10:07:00Z",requestId:"req-merchant-approve"});assert.equal(merchantRequest.status,"PENDING_OPERATOR_REVIEW");
  const productCli=execFileSync(process.execPath,["scripts/mercury-product-identity-review-prepare.mjs",`--state=${join(root,"evidence.json")}`,`--out=${join(root,"product-request.json")}`],{cwd:process.cwd(),encoding:"utf8"});assert.match(productCli,/PENDING_OPERATOR_REVIEW/);assert.match(productCli,/Actual spend:\s+\$0\.000/);
  const merchantCli=execFileSync(process.execPath,["scripts/mercury-merchant-identity-review-prepare.mjs",`--state=${join(root,"evidence.json")}`,`--out=${join(root,"merchant-request.json")}`,"--merchant-id=RETAILER-PLATINUMMICRO"],{cwd:process.cwd(),encoding:"utf8"});assert.match(merchantCli,/PENDING_OPERATOR_REVIEW/);assert.match(merchantCli,/Paid task created:\s+NO/);
  const merchantApproved=await service.recordMerchantDecision({discoveredMerchantName:"Platinummicro",canonicalMerchantName:"Platinummicro",canonicalDomain:"platinummicro.com",merchantId:"RETAILER-0002",merchantActive:true,previousState:"DISCOVERED",requestedState:"REGISTERED",decisionOutcome:"APPROVED",reviewedAt:"2026-08-22T10:08:00Z",reviewedBy:"operator:test",reason:"Canonical business identity and domain reviewed.",supportingEvidenceReferences:[record.evidenceId],contradictionStatus:"NONE",audit:{source:"OPERATOR_REVIEW",requestId:"req-merchant-approve",preparedAt:"2026-08-22T10:07:00Z"}});
  assert.equal(merchantApproved.identityReviewDecisionId,"mer_idrev_000000003");
  assert.deepEqual(await evidenceRepository.getById(record.evidenceId),original);
  const decisions=await decisionRepository.getAll();assert.equal(decisions.length,3);assert.equal(decisions[0].subjectType,"PRODUCT_IDENTITY");assert.equal(decisions[1].decisionOutcome,"REJECTED");
  const reassessed=assessDataForSeoEvidencePromotion({records:[record],identityReviewDecisions:decisions,atlasRetailers});assert.equal(reassessed.state,"HISTORICAL_ELIGIBLE");assert.equal(reassessed.productIdentity,"VERIFIED");assert.equal(reassessed.merchantIdentity,"REGISTERED");assert.equal(reassessed.historicalEligible,true);assert.equal(reassessed.canonicalEligible,false);assert.equal(reassessed.publicationEligible,false);assert.ok(reassessed.reasons.some(x=>x.code==="CANONICAL_PROMOTION_POLICY_MISSING"));
  const replay=await service.recordMerchantDecision({discoveredMerchantName:"Platinummicro",canonicalMerchantName:"Platinummicro",canonicalDomain:"platinummicro.com",merchantId:"RETAILER-0002",merchantActive:true,previousState:"DISCOVERED",requestedState:"REGISTERED",decisionOutcome:"APPROVED",reviewedAt:"2026-08-22T10:08:00Z",reviewedBy:"operator:test",reason:"Canonical business identity and domain reviewed.",supportingEvidenceReferences:[record.evidenceId],contradictionStatus:"NONE",audit:{source:"OPERATOR_REVIEW",requestId:"req-merchant-approve",preparedAt:"2026-08-22T10:07:00Z"}});assert.equal(replay.identityReviewDecisionId,merchantApproved.identityReviewDecisionId);assert.equal((await decisionRepository.getAll()).length,3);
  assert.equal(assessDataForSeoEvidencePromotion({records:[record],identityReviewDecisions:decisions,promotionPolicy:null}).state,"BLOCKED");
}finally{await rm(root,{recursive:true,force:true});}
console.log("Identity review governance tests passed.");
