import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {FileFirstPartyProductInterestCollectionRepository,FirstPartyProductInterestCollectionRepository,FirstPartyProductInterestCollectionService,PublicProductInterestDestinationRepository,validateFirstPartyProductInterestEvent} from "../index.js";

const productId="ram_fixture_ddr5",retailerId="RETAILER-0004",destinationId="mer_dest_aaaaaaaaaaaaaaaaaaaaaaaa",occurredAt="2026-10-24T20:00:00.000Z",recordedAt="2026-10-24T20:00:01.000Z";
const products=[{identity:{atlasProductId:productId}},{identity:{atlasProductId:"ram_other_ddr5"}}],retailers=[{id:retailerId},{id:"RETAILER-0002"}],productRepository={getById:async id=>structuredClone(products.find(value=>value.identity.atlasProductId===id)??null)},retailerRepository={getById:async id=>structuredClone(retailers.find(value=>value.id===id)??null)};
const projection={schemaVersion:"1.0",policyVersion:"PUBLIC-RAM-CURRENT-RETAIL-001-1.0",asOf:recordedAt,state:"AVAILABLE",comparisonSemantics:"ITEM_PRICE",disclosure:"Prices shown exclude applicable shipping, taxes, and fees.",freshness:{maxAgeHours:36},counts:{sourceOffers:1,publicCurrentEligibleOffers:1,staleOffers:0},winners:{overall:null,ddr5:null,ddr4:null,laptop:null},products:[{atlasProductId:productId,status:"CURRENT_PRICE_AVAILABLE",lowerCurrentItemPrice:null,eligibleOfferCount:1,offers:[{atlasProductId:productId,brand:"Fixture",family:null,series:null,displayName:"Fixture DDR5",ddrGeneration:"DDR5",formFactor:"DIMM",totalCapacityGb:32,moduleCount:2,capacityPerModuleGb:16,speedMtps:6000,casLatency:30,retailerId,retailerName:"Newegg",destinationId,destinationUrl:"https://www.newegg.com/p/FIXTURE",itemPriceUsd:99.99,currency:"USD",observedAt:occurredAt,ageHours:0,freshness:"PUBLIC_CURRENT",comparisonSemantics:"ITEM_PRICE",comparisonEligible:false,shippingUsd:null,feesUsd:null,taxesIncluded:false}]}]};
const destinationRepository=new PublicProductInterestDestinationRepository({publicCurrentRetailProjection:projection});
const createService=(publicOfferRepository=destinationRepository)=>new FirstPartyProductInterestCollectionService({productRepository,retailerRepository,publicOfferRepository,collectionRepository:new FirstPartyProductInterestCollectionRepository()});
const event=(overrides={})=>({schemaVersion:"1.1",eventId:"123e4567-e89b-42d3-a456-426614174000",signalType:"OUTBOUND_RETAILER_CLICK",atlasProductId:productId,destinationId,retailerId,catalogCategory:"DDR5",placement:"CATALOG_CARD",occurredAt,...overrides});

const service=createService(),accepted=await service.collect({event:event(),recordedAt});
assert.equal(accepted.status,"ACCEPTED");
assert.equal(accepted.signal.provenance.destinationId,destinationId);
assert.equal(accepted.signal.provenance.catalogCategory,"DDR5");
assert.equal(accepted.signal.provenance.placement,"CATALOG_CARD");
assert.equal(accepted.signal.provenance.publicDestinationValidated,true);
assert.equal("destinationUrl" in accepted.signal.provenance,false);
assert.equal((await service.collect({event:event(),recordedAt})).status,"DUPLICATE");
await assert.rejects(()=>service.collect({event:event({placement:"HERO"}),recordedAt}),/EVENT_CONFLICT/);

for(const [overrides,error] of [
 [{atlasProductId:"ram_other_ddr5"},/PUBLIC_DESTINATION_BINDING_INVALID/],
 [{retailerId:"RETAILER-0002"},/PUBLIC_DESTINATION_BINDING_INVALID/],
 [{catalogCategory:"DDR4"},/PUBLIC_DESTINATION_BINDING_INVALID/],
 [{destinationId:"mer_dest_bbbbbbbbbbbbbbbbbbbbbbbb"},/PUBLIC_DESTINATION_NOT_FOUND/],
 [{occurredAt:"invalid"},/EVENT_INVALID/],
 [{occurredAt:"2026-10-24T20:00:02.000Z"},/RECORDED_AT_INVALID/]
])await assert.rejects(()=>createService().collect({event:event(overrides),recordedAt}),error);

const ambiguous={getByDestinationId:async()=>[{...projection.products[0].offers[0],eligible:true,catalogCategories:["DDR5","OVERALL"]},{...projection.products[0].offers[0],eligible:true,catalogCategories:["DDR5","OVERALL"]}]};
await assert.rejects(()=>createService(ambiguous).collect({event:event(),recordedAt}),/PUBLIC_DESTINATION_AMBIGUOUS/);
for(const offer of [{eligible:false,freshness:"PUBLIC_CURRENT"},{eligible:true,freshness:"STALE"}])await assert.rejects(()=>createService({getByDestinationId:async()=>[{...offer,atlasProductId:productId,retailerId,catalogCategories:["DDR5","OVERALL"]}]}).collect({event:event(),recordedAt}),/PUBLIC_DESTINATION_INELIGIBLE/);

for(const forbidden of [{name:"Person"},{email:"person@example.com"},{ipAddress:"192.0.2.1"},{userAgent:"agent"},{sessionId:"session"},{destinationUrl:"https://example.com/?tag=secret"},{url:"https://example.com"},{referrer:"https://example.com"},{affiliateToken:"secret"},{location:"Kingston"},{unknown:"value"}])assert.throws(()=>validateFirstPartyProductInterestEvent(event(forbidden)),/EVENT_INVALID/);
assert.throws(()=>validateFirstPartyProductInterestEvent(event({notes:"x".repeat(3000)})),/EVENT_INVALID/);
assert.throws(()=>validateFirstPartyProductInterestEvent(event({eventId:"not-random"})),/EVENT_INVALID/);
assert.throws(()=>validateFirstPartyProductInterestEvent(event({destinationId:undefined})),/EVENT_INVALID/);
assert.throws(()=>validateFirstPartyProductInterestEvent(event(),{maximumPayloadBytes:20}),/EVENT_INVALID/);

const affiliate=await destinationRepository.getByDestinationId(destinationId);assert.equal(affiliate.length,1);assert.equal("destinationUrl" in affiliate[0],false);
const ordinaryProjection=structuredClone(projection);ordinaryProjection.products[0].offers[0].retailerId="RETAILER-0002";ordinaryProjection.products[0].offers[0].retailerName="Ordinary retailer";ordinaryProjection.products[0].offers[0].destinationId="mer_dest_cccccccccccccccccccccccc";ordinaryProjection.winners={overall:null,ddr5:null,ddr4:null,laptop:null};const ordinary=new PublicProductInterestDestinationRepository({publicCurrentRetailProjection:ordinaryProjection});assert.equal((await ordinary.getByDestinationId("mer_dest_cccccccccccccccccccccccc"))[0].retailerId,"RETAILER-0002");

const legacy={schemaVersion:"1.0",eventId:"historical-event-1",atlasProductId:productId,signalType:"OUTBOUND_RETAILER_CLICK",sourceSurface:"CATEGORY_DDR5",occurredAt,retailerId};
assert.deepEqual(validateFirstPartyProductInterestEvent(legacy),legacy);
assert.equal((await new FirstPartyProductInterestCollectionService({productRepository,retailerRepository,collectionRepository:new FirstPartyProductInterestCollectionRepository()}).collect({event:legacy,recordedAt})).status,"ACCEPTED");
assert.throws(()=>validateFirstPartyProductInterestEvent({...legacy,schemaVersion:"1.1"}),/EVENT_INVALID/);

const root=await fs.mkdtemp(join(tmpdir(),"beacon-outbound-contract-"));
try{const statePath=join(root,"events.json"),durable=new FirstPartyProductInterestCollectionService({productRepository,retailerRepository,publicOfferRepository:destinationRepository,collectionRepository:new FileFirstPartyProductInterestCollectionRepository({statePath})});assert.equal((await durable.collect({event:event({eventId:"223e4567-e89b-42d3-a456-426614174000"}),recordedAt})).status,"ACCEPTED");const replayed=new FirstPartyProductInterestCollectionService({productRepository,retailerRepository,publicOfferRepository:destinationRepository,collectionRepository:new FileFirstPartyProductInterestCollectionRepository({statePath})});assert.equal((await replayed.collect({event:event({eventId:"223e4567-e89b-42d3-a456-426614174000"}),recordedAt})).status,"DUPLICATE");}finally{await fs.rm(root,{recursive:true,force:true});}

console.log("Beacon governed outbound retailer click contract tests passed.");
