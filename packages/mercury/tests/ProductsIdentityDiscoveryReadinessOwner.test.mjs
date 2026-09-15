import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { ProductsIdentityDiscoveryReadinessOwner as Owner } from "../bounded/ProductsIdentityDiscoveryReadinessOwner.js";

const asOf="2026-09-14T12:00:00.000Z", product=id=>({identity:{atlasProductId:id}}), allowed={sourceId:"SOURCE",acquisition:{api:"ALLOWED"},retention:{historical:"ALLOWED",durableAuditMetadata:"ALLOWED"}}, blocked={...allowed,acquisition:{api:"BLOCKED"}};
function make({google={status:"ABSENT"},artifacts=[],outcomes={},rights=allowed,exists=true}={}){return new Owner({productRepository:{getById:async id=>exists?product(id):null},rightsRegistry:{require:source=>rights[source]??rights},googleIdentityResolver:{resolve:async()=>structuredClone(google)},amazonArtifactRepository:{getAll:async()=>structuredClone(artifacts)},amazonActionRepository:{getEffectiveOutcomeForArtifact:async id=>structuredClone(outcomes[id]??null)}})}
const assess=(owner,source="DATAFORSEO_GOOGLE_SHOPPING",id="ram_fixture")=>owner.assess({atlasProductId:id,sourceId:source,asOf});
let cases=0;
assert.equal((await assess(make())).readinessState,"READY_FOR_DISCOVERY"); cases++;
const reusable={status:"REUSABLE",productId:"p",dataDocId:"d",gid:"g",bindingDigest:"a".repeat(64)}, first=await assess(make({google:reusable})), replay=await assess(make({google:reusable})); assert.equal(first.readinessState,"ALREADY_RESOLVED"); assert.equal(first.readinessBindingDigest,replay.readinessBindingDigest); cases+=2;
assert.equal((await assess(make({google:{status:"REVIEW_REQUIRED",reason:"CONFLICTING_GOVERNED_PROVIDER_IDENTITIES"}}))).readinessState,"REVIEW_REQUIRED"); cases++;
assert.equal((await assess(make({rights:{DATAFORSEO_GOOGLE_SHOPPING:blocked}}))).readinessState,"RIGHTS_BLOCKED"); cases++;
assert.equal((await assess(make(),"UNKNOWN_SOURCE")).readinessState,"UNSUPPORTED"); assert.equal((await assess(make({exists:false}))).readinessState,"UNSUPPORTED"); cases+=2;
const artifact={acceptanceArtifactId:"artifact",atlasProductId:"ram_fixture"};
for(const outcome of [{state:"STRONG_UNIQUE_ASIN",governedAsin:"B000000001",outcomeId:"o1"},{state:"STRONG_UNIQUE_ASIN",identityResolution:"STRONG_OPERATOR_CONFIRMED_ASIN",governedAsin:"B000000001",outcomeId:"o2"}]){assert.equal((await assess(make({artifacts:[artifact],outcomes:{artifact:outcome}}),"DATAFORSEO_AMAZON")).readinessState,"ALREADY_RESOLVED");cases++;}
assert.equal((await assess(make({artifacts:[artifact],outcomes:{artifact:{state:"INSUFFICIENT_ASIN_EVIDENCE",sellersAuthorizationEligible:false,nextPermittedAction:"STOP",outcomeId:"o3"}}}),"DATAFORSEO_AMAZON")).readinessState,"REVIEW_REQUIRED"); cases++;
assert.equal((await assess(make(),"DATAFORSEO_AMAZON")).readinessState,"READY_FOR_DISCOVERY"); cases++;
assert.equal((await assess(make({rights:{DATAFORSEO_AMAZON:blocked}}),"DATAFORSEO_AMAZON")).readinessState,"RIGHTS_BLOCKED"); cases++;
let amazonReads=0;const isolated=new Owner({productRepository:{getById:async id=>product(id)},rightsRegistry:{require:()=>allowed},googleIdentityResolver:{resolve:async()=>({status:"ABSENT"})},amazonArtifactRepository:{getAll:async()=>{amazonReads++;return[artifact];}},amazonActionRepository:{getEffectiveOutcomeForArtifact:async()=>({state:"STRONG_UNIQUE_ASIN",governedAsin:"B000000001"})}});assert.equal((await assess(isolated)).readinessState,"READY_FOR_DISCOVERY");assert.equal(amazonReads,0);cases+=2;
assert.notEqual(first.readinessBindingDigest,(await assess(make({google:{...reusable,bindingDigest:"b".repeat(64)}}))).readinessBindingDigest); cases++;
assert.notEqual((await assess(make())).readinessBindingDigest,(await assess(make({rights:{...allowed,status:"DRIFT"}}))).readinessBindingDigest); cases++;
for(const size of [10,100,1000,10000]){const owner=make(),start=performance.now();const results=await Promise.all(Array.from({length:size},(_,i)=>assess(owner,"DATAFORSEO_GOOGLE_SHOPPING",`ram_${i}`)));assert.equal(results.length,size);assert.ok(results.every(x=>x.readinessState==="READY_FOR_DISCOVERY"));console.log(`Products identity readiness scale ${size}: ${(performance.now()-start).toFixed(2)} ms`);cases++;}
console.log(`Products identity discovery readiness owner tests passed (${cases} cases).`);
