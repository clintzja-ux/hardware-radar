import assert from "node:assert/strict";
import {mkdtemp} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {assessHistoricalFactEligibility,createHistoricalObservation,FileHistoricalObservationRepository,HistoricalObservationIntelligence,validateHistoricalObservation} from "../index.js";

const record={evidenceId:"dfev_fixture",candidate:{identity:{atlasProductId:"ram_fixture"},marketEvidence:{atlasProductId:"ram_fixture",pricing:{basePrice:100,currency:"USD"},provenance:{observedAt:"2026-09-13T00:00:00Z",sourceTaskId:"task-1",rawPayloadReference:"fixture:1"}}}};
const verified={state:"VERIFIED",atlasProductId:"ram_fixture"};
const eligible=assessHistoricalFactEligibility({record,productProjection:verified});
assert.equal(eligible.factLevelHistoricalEligible,true);
assert.equal(eligible.canonicalEligible,false);
assert.equal(eligible.currentPriceEligible,false);
assert.equal(eligible.cheapestEligible,false);
assert.equal(eligible.pickEligible,false);
assert.equal(eligible.publicationEligible,false);
for(const [mutate,reason] of [[r=>{r.candidate.marketEvidence.pricing.basePrice=null;},"HISTORICAL_FACT_ITEM_PRICE_INVALID"],[r=>{r.candidate.marketEvidence.pricing.currency="usd";},"HISTORICAL_FACT_CURRENCY_INVALID"],[r=>{r.candidate.marketEvidence.provenance.rawPayloadReference=null;},"HISTORICAL_FACT_PROVENANCE_INCOMPLETE"]]){const invalid=structuredClone(record);mutate(invalid);assert.ok(assessHistoricalFactEligibility({record:invalid,productProjection:verified}).reasons.includes(reason));}
assert.ok(assessHistoricalFactEligibility({record,productProjection:{state:"PROBABLE",atlasProductId:"ram_fixture"}}).reasons.includes("HISTORICAL_FACT_PRODUCT_NOT_VERIFIED"));
assert.ok(assessHistoricalFactEligibility({record,productProjection:verified,criticalContradiction:true}).reasons.includes("HISTORICAL_FACT_CRITICAL_PRODUCT_CONTRADICTION"));

const observation=createHistoricalObservation({factLevel:true,observationId:"mer_hist_0123456789abcdef",atlasProductId:"ram_fixture",retailerId:null,marketplace:"amazon.com",observationTime:"2026-09-13T00:00:00Z",admittedAt:"2026-09-13T01:00:00Z",market:{sellerName:"Observed Seller",sourceUrl:null,basePrice:100,totalPrice:null,shipping:null,tax:null,currency:"USD",condition:null,availability:null,delivery:{delivery_message:"FREE delivery",delivery_price:null}},observedMerchant:{sellerName:"Observed Seller",suppliedDomain:"amazon.com",resolutionState:"DISCOVERED",canonicalRetailerId:null,canonicalMerchantName:null,canonicalDomain:null,decisionId:null},comparability:{policyVersion:"MERCURY-HISTORY-018-1.0",assessmentId:"mer_histcompare_fixture",classification:"UNKNOWN_COMPARABILITY",reasons:["HISTORICAL_OFFER_COMPARABILITY_UNKNOWN"],standaloneEligible:false},provenance:{retainedEvidenceId:"dfev_fixture",provider:"DATAFORSEO",source:"DATAFORSEO_AMAZON",rawPayloadReference:"fixture:1",acquisition:{type:"AMAZON_INITIAL_ACQUISITION",productsTaskId:"p",sellersTaskId:"s",governedAsin:"B000000000",immutableSellersResultId:"result",immutableSellersResultDigest:"digest",sourceRightsProfileDigest:"rights"},rights:{sourceId:"DATAFORSEO_AMAZON",profileHash:"hash"},identityReview:{productDecisionId:null,productRemediationId:null,merchantDecisionId:null,merchantRemediationId:null}},admittedBy:"fixture",idempotencyKey:"fixture"});
assert.equal(validateHistoricalObservation(observation).valid,true);
assert.equal(observation.retailerId,null);
assert.equal(observation.market.shipping,null);
assert.equal(observation.market.condition,null);
assert.equal(observation.market.delivery.delivery_price,null);
assert.equal(observation.comparability.standaloneEligible,false);
const intelligence=await new HistoricalObservationIntelligence({repository:{getAll:async()=>[observation]}}).query({atlasProductId:"ram_fixture"});
assert.equal(intelligence.observationCount,1);
assert.equal(intelligence.comparableObservationCount,0);
assert.deepEqual(intelligence.retailerIds,[]);
assert.equal(intelligence.latestBasePrice,null);
assert.equal(intelligence.trendState,"NON_COMPARABLE");

const repository=new FileHistoricalObservationRepository({statePath:join(await mkdtemp(join(tmpdir(),"historical-fact-replay-")),"observations.json")});
assert.equal((await repository.accept(observation,"fixture")).status,"ADMITTED");
assert.equal((await repository.accept(observation,"fixture")).status,"DUPLICATE");
const conflicting=createHistoricalObservation({...structuredClone(observation),market:{...structuredClone(observation.market),basePrice:101},factLevel:true,admittedAt:observation.admittedAt,admittedBy:observation.metadata.admittedBy,idempotencyKey:observation.metadata.idempotencyKey});
await assert.rejects(()=>repository.accept(conflicting,"fixture"),/HISTORICAL_OBSERVATION_REPLAY_CONFLICT/);

console.log("Historical fact admission policy tests passed.");
