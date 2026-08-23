import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdtemp,rm,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {
  FileDataForSeoMarketEvidenceRepository,FileIdentityReviewDecisionRepository,IdentityReviewService,
  prepareProductIdentityReview,prepareMerchantIdentityReview,assessDataForSeoEvidencePromotion
} from "../index.js";

const candidate={candidateVersion:"1.0",candidateType:"MERCURY_MARKET_OBSERVATION",marketEvidence:{evidenceVersion:"1.0",provider:"DATAFORSEO",source:"DATAFORSEO_GOOGLE_SHOPPING",sourceMethod:"API",seller:{name:"Platinummicro",domain:"platinummicro.com",url:"https://platinummicro.com/item"},pricing:{basePrice:588.99,shippingPrice:null,tax:null,totalPrice:588.99,currency:"USD"},offer:{condition:null,details:"Corsair CMK32GX5M2B6000Z30",availability:"in_stock"},productEvidence:{title:"Corsair CMK32GX5M2B6000Z30",dataDocId:"3844868436216882408",productId:null,gid:null},provenance:{sourceTaskId:"sellers-task-approval",observedAt:"2026-08-21T16:31:45.604Z",rawPayloadReference:"fixture:e2i1"}},identity:{outcome:"PROBABLE",atlasProductId:"ram_corsair_cmk32gx5m2b6000z30",externalProductId:null,candidateAtlasProductIds:[],evidence:[]},governance:{requiresReview:true,canonicalObservationEligible:false,automaticPublicationEligible:false}};
const merchant={resolutionVersion:"1.0",outcome:"DISCOVERED",retailerId:null,merchantKey:"domain:platinummicro.com",sellerName:"Platinummicro",canonicalDomain:"platinummicro.com",suppliedDomain:"platinummicro.com",urlDomain:"platinummicro.com",requiresRegistration:true,evidence:[],reason:"ATLAS_RETAILER_NOT_FOUND"};
const eligibility={eligibilityVersion:"1.0",status:"REVIEW_REQUIRED",canonicalObservationEligible:false,rawEvidenceRetentionEligible:true,historicalAnalyticsEligible:false,retailerId:null,requiresReview:true,reasons:["MERCHANT_REGISTRATION_REQUIRED"]};
const atlasRetailers=[{id:"RETAILER-0002",name:"Platinummicro",slug:"platinummicro",websiteUrl:"https://platinummicro.com",status:"active",regions:["US"],supportedCurrencies:["USD"],affiliateProgram:{available:false,status:"unknown",network:null,disclosureRequired:true},metadata:{createdAt:"2026-08-23T00:00:00Z",updatedAt:"2026-08-23T00:00:00Z",sourceReferences:["Platinummicro"]}}];

async function setup(root){const evidencePath=join(root,"evidence.json");const decisionPath=join(root,"decisions.json");const evidenceRepository=new FileDataForSeoMarketEvidenceRepository({statePath:evidencePath,now:()=>"2026-08-22T10:00:00Z"});const retained=await evidenceRepository.retain({candidate,merchantResolution:merchant,eligibility});const record=await evidenceRepository.getById(retained.evidenceId);const decisionRepository=new FileIdentityReviewDecisionRepository({statePath:decisionPath,now:()=>"2026-08-22T10:10:00Z"});const retailerRepository={getAll:async()=>atlasRetailers};return{evidencePath,decisionPath,evidenceRepository,decisionRepository,service:new IdentityReviewService({evidenceRepository,decisionRepository,retailerRepository}),record};}
const root=await mkdtemp(join(tmpdir(),"hardware-radar-e2i1-"));
try{
  const x=await setup(root);const original=structuredClone(x.record);
  const productRequest=prepareProductIdentityReview({records:[x.record],atlasProductId:candidate.identity.atlasProductId,preparedAt:"2026-08-22T10:01:00Z",requestId:"product-review-ram_corsair_cmk32gx5m2b6000z30"});
  const productInput={request:productRequest,requestId:productRequest.requestId,confirmationToken:"APPROVE-PRODUCT-IDENTITY",reviewedBy:"operator:test",reason:"Reviewed exact manufacturer identity evidence.",contradictionStatus:"NONE",reviewedAt:"2026-08-22T10:05:00Z",atlasProductId:candidate.identity.atlasProductId};
  await assert.rejects(()=>x.service.approvePreparedProductRequest({...productInput,confirmationToken:"yes"}),/EXPLICIT_CONFIRMATION_REQUIRED/);
  await assert.rejects(()=>x.service.approvePreparedProductRequest({...productInput,reviewedBy:""}),/REVIEWED_BY_REQUIRED/);
  await assert.rejects(()=>x.service.approvePreparedProductRequest({...productInput,reviewedBy:"<YOUR_OPERATOR_LABEL>"}),/non-placeholder operator identity/);
  await assert.rejects(()=>x.service.approvePreparedProductRequest({...productInput,reason:""}),/REVIEW_REASON_REQUIRED/);
  await assert.rejects(()=>x.service.approvePreparedProductRequest({...productInput,contradictionStatus:"CRITICAL"}),/CRITICAL_IDENTITY_CONTRADICTION/);
  await assert.rejects(()=>x.service.approvePreparedProductRequest({...productInput,requestId:"substituted"}),/REQUEST_ID_MISMATCH/);
  await assert.rejects(()=>x.service.approvePreparedProductRequest({...productInput,request:{...productRequest,requestedState:"REGISTERED"}}),/REQUEST_BINDING_INVALID/);
  const product=await x.service.approvePreparedProductRequest(productInput);assert.equal(product.previousState,"PROBABLE");assert.equal(product.requestedState,"VERIFIED");assert.equal(product.decisionOutcome,"APPROVED");assert.equal(product.retainedEvidenceModified,false);assert.equal(product.promotionAuthorized,false);
  assert.deepEqual(await x.evidenceRepository.getById(x.record.evidenceId),original);
  const productReplay=await x.service.approvePreparedProductRequest({...productInput,reviewedAt:"2026-08-22T10:06:00Z"});assert.equal(productReplay.identityReviewDecisionId,product.identityReviewDecisionId);assert.equal((await x.decisionRepository.getAll()).length,1);
  await assert.rejects(()=>x.service.approvePreparedProductRequest({...productInput,reason:"Different approval basis.",reviewedAt:"2026-08-22T10:07:00Z"}),/CANONICAL_STATE_CONFLICT/);
  assert.equal(assessDataForSeoEvidencePromotion({records:[x.record]}).state,"REVIEW_REQUIRED");
  assert.equal(assessDataForSeoEvidencePromotion({records:[x.record],identityReviewDecisions:[product]}).state,"REVIEW_REQUIRED");

  const merchantRequest=prepareMerchantIdentityReview({records:[x.record],canonicalDomain:"platinummicro.com",canonicalMerchantName:"Platinummicro",merchantId:"RETAILER-0002",preparedAt:"2026-08-22T10:02:00Z",requestId:"merchant-review-platinummicro.com"});
  const merchantInput={request:merchantRequest,requestId:merchantRequest.requestId,confirmationToken:"APPROVE-MERCHANT-IDENTITY",reviewedBy:"operator:test",reason:"Reviewed canonical merchant identity and domain.",contradictionStatus:"NONE",reviewedAt:"2026-08-22T10:08:00Z",canonicalDomain:"platinummicro.com",merchantId:"RETAILER-0002"};
  await assert.rejects(()=>x.service.approvePreparedMerchantRequest({...merchantInput,confirmationToken:"yes"}),/EXPLICIT_CONFIRMATION_REQUIRED/);
  await assert.rejects(()=>x.service.approvePreparedMerchantRequest({...merchantInput,reviewedBy:""}),/REVIEWED_BY_REQUIRED/);
  await assert.rejects(()=>x.service.approvePreparedMerchantRequest({...merchantInput,reviewedBy:"<REVIEWED_BY>"}),/non-placeholder operator identity/);
  await assert.rejects(()=>x.service.approvePreparedMerchantRequest({...merchantInput,reason:""}),/REVIEW_REASON_REQUIRED/);
  await assert.rejects(()=>x.service.approvePreparedMerchantRequest({...merchantInput,contradictionStatus:"CRITICAL"}),/CRITICAL_IDENTITY_CONTRADICTION/);
  await assert.rejects(()=>x.service.approvePreparedMerchantRequest({...merchantInput,canonicalDomain:"example.com"}),/DOMAIN_MISMATCH/);
  await assert.rejects(()=>x.service.approvePreparedMerchantRequest({...merchantInput,merchantId:"RETAILER-9999"}),/ID_MISMATCH/);
  await assert.rejects(()=>x.service.approvePreparedMerchantRequest({...merchantInput,request:{...merchantRequest,supportingEvidenceReferences:["substituted"]}}),/EVIDENCE_SUBSTITUTION/);
  const registered=await x.service.approvePreparedMerchantRequest(merchantInput);assert.equal(registered.previousState,"DISCOVERED");assert.equal(registered.requestedState,"REGISTERED");assert.equal(registered.merchantId,"RETAILER-0002");assert.deepEqual(await x.evidenceRepository.getById(x.record.evidenceId),original);
  const merchantReplay=await x.service.approvePreparedMerchantRequest({...merchantInput,reviewedAt:"2026-08-22T10:09:00Z"});assert.equal(merchantReplay.identityReviewDecisionId,registered.identityReviewDecisionId);assert.equal((await x.decisionRepository.getAll()).length,2);
  await assert.rejects(()=>x.service.approvePreparedMerchantRequest({...merchantInput,reviewedBy:"operator:other",reviewedAt:"2026-08-22T10:10:00Z"}),/CANONICAL_STATE_CONFLICT/);
  assert.equal(product.subjectType,"PRODUCT_IDENTITY");assert.equal(registered.subjectType,"MERCHANT_IDENTITY");
  const reassessed=assessDataForSeoEvidencePromotion({records:[x.record],identityReviewDecisions:[product,registered],atlasRetailers});assert.equal(reassessed.state,"HISTORICAL_ELIGIBLE");assert.equal(reassessed.historicalEligible,true);assert.equal(reassessed.canonicalEligible,false);assert.equal(reassessed.publicationEligible,false);

  const cliRoot=join(root,"cli");const y=await setup(cliRoot);const productPath=join(cliRoot,"product-request.json");const merchantPath=join(cliRoot,"merchant-request.json");await writeFile(productPath,JSON.stringify(prepareProductIdentityReview({records:[y.record],atlasProductId:candidate.identity.atlasProductId,preparedAt:"2026-08-22T11:00:00Z",requestId:"product-review-ram_corsair_cmk32gx5m2b6000z30"})),"utf8");await writeFile(merchantPath,JSON.stringify(prepareMerchantIdentityReview({records:[y.record],canonicalDomain:"platinummicro.com",canonicalMerchantName:"Platinummicro",merchantId:"RETAILER-0002",preparedAt:"2026-08-22T11:00:00Z",requestId:"merchant-review-platinummicro.com"})),"utf8");
  const productCli=execFileSync(process.execPath,["scripts/mercury-product-identity-review-approve.mjs",`--request=${productPath}`,`--evidence-state=${y.evidencePath}`,`--decision-state=${y.decisionPath}`,"--request-id=product-review-ram_corsair_cmk32gx5m2b6000z30","--confirm=APPROVE-PRODUCT-IDENTITY","--reviewed-by=operator:test","--reason=Fixture product approval","--contradiction-status=NONE",`--atlas-product=${candidate.identity.atlasProductId}`],{cwd:process.cwd(),encoding:"utf8"});assert.match(productCli,/Promotion authorized:\s+NO/);assert.match(productCli,/Actual spend:\s+\$0\.000/);
  const merchantCli=execFileSync(process.execPath,["scripts/mercury-merchant-identity-review-approve.mjs",`--request=${merchantPath}`,`--evidence-state=${y.evidencePath}`,`--decision-state=${y.decisionPath}`,"--request-id=merchant-review-platinummicro.com","--confirm=APPROVE-MERCHANT-IDENTITY","--reviewed-by=operator:test","--reason=Fixture merchant approval","--contradiction-status=NONE","--domain=platinummicro.com","--merchant-id=RETAILER-0002"],{cwd:process.cwd(),encoding:"utf8"});assert.match(merchantCli,/Retained evidence changed:\s+NO/);assert.match(merchantCli,/Paid task created:\s+NO/);assert.equal((await y.decisionRepository.getAll()).length,2);assert.deepEqual(await y.evidenceRepository.getById(y.record.evidenceId),y.record);
}finally{await rm(root,{recursive:true,force:true});}
console.log("Identity review approval command tests passed.");
