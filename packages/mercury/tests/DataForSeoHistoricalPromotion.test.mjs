import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
    DataForSeoHistoricalPromotionService,
    FileDataForSeoMarketEvidenceRepository,
    InMemoryObservationAcceptanceStore,
    createDataForSeoMarketObservationCandidate,
    evaluateDataForSeoObservationEligibility,
    resolveDataForSeoMerchantIdentity,
    HistoricalIntelligence
} from "../index.js";
import { normalizeDataForSeoSellerEvidence } from "../adapters/dataforseo/DataForSeoSellerNormalizer.js";

const root = await mkdtemp(join(tmpdir(), "hardware-radar-df003d-promotion-"));
try {
    const evidence = normalizeDataForSeoSellerEvidence({
        type:"shops_list", seller_name:"Central Computers", domain:"www.centralcomputer.com",
        url:"https://www.centralcomputer.com/corsair-cmk32gx5m2b6000z30.html", base_price:549.99,
        tax:null, shipping_price:38.260695, total_price:588.25, currency:"USD",
        product_condition:null, product_availability:"in_stock", details:"Corsair CMK32GX5M2B6000Z30"
    }, {
        sourceTaskId:"08160527-2304-0183-0000-1446c8b7b26b", observedAt:"2026-08-16T05:27:00Z",
        productTitle:"Corsair CMK32GX5M2B6000Z30", dataDocId:"17540895125310173539",
        rawPayloadReference:"fixture:live1-sellers-result"
    });
    const probable = createDataForSeoMarketObservationCandidate({ marketEvidence:evidence, atlasResolution:{ outcome:"PROBABLE", atlasProductId:"ram_corsair_cmk32gx5m2b6000z30", evidence:[], automaticMercuryEligible:false } });
    const discoveredMerchant = resolveDataForSeoMerchantIdentity({ marketEvidence:evidence, retailers:[] });
    const retentionEligibility = evaluateDataForSeoObservationEligibility({ candidate:probable, merchantResolution:discoveredMerchant });
    const evidenceRepo = new FileDataForSeoMarketEvidenceRepository({ statePath:join(root,"evidence.json"), now:()=>"2026-08-16T06:00:00Z" });
    const retained = await evidenceRepo.retain({ candidate:probable, merchantResolution:discoveredMerchant, eligibility:retentionEligibility });

    const observations = new InMemoryObservationAcceptanceStore();
    const service = new DataForSeoHistoricalPromotionService({ evidenceRepository:evidenceRepo, observationRepository:observations, now:()=>"2026-08-17T12:00:00Z" });

    const notEligible = await service.promote({
        evidenceId:retained.evidenceId,
        atlasResolution:{ outcome:"PROBABLE", atlasProductId:"ram_corsair_cmk32gx5m2b6000z30", evidence:[], automaticMercuryEligible:false },
        merchantResolution:discoveredMerchant,
        createdBy:"df003d-test"
    });
    assert.equal(notEligible.status,"NOT_ELIGIBLE");
    assert.equal((await observations.getAll()).length,0);

    const resolvedMerchant = resolveDataForSeoMerchantIdentity({ marketEvidence:evidence, retailers:[{ id:"RETAILER-0042", name:"Central Computers", websiteUrl:"https://centralcomputer.com" }] });
    await assert.rejects(() => service.promote({
        evidenceId:retained.evidenceId,
        atlasResolution:{ outcome:"CONFIRMED", atlasProductId:"ram_corsair_cmk32gx5m2b6000z30", evidence:[], automaticMercuryEligible:true },
        merchantResolution:{ ...resolvedMerchant, canonicalDomain:"example.com" },
        createdBy:"df003d-test"
    }), /MERCHANT_MISMATCH/);

    const promoted = await service.promote({
        evidenceId:retained.evidenceId,
        atlasResolution:{ outcome:"CONFIRMED", atlasProductId:"ram_corsair_cmk32gx5m2b6000z30", evidence:[{field:"manufacturerPartNumber",status:"MATCH"}], automaticMercuryEligible:true },
        merchantResolution:resolvedMerchant,
        createdBy:"df003d-test"
    });
    assert.equal(promoted.status,"PROMOTED");
    assert.equal(promoted.observation.observationTime,"2026-08-16T05:27:00Z");
    assert.equal(promoted.observation.metadata.createdAt,"2026-08-17T12:00:00Z");
    assert.equal(promoted.observation.retailerId,"RETAILER-0042");
    assert.equal(promoted.observation.marketplace,"centralcomputer.com");
    assert.equal(promoted.observation.offer.price,549.99);
    assert.equal(promoted.observation.offer.shipping.cost,38.260695);
    assert.equal(promoted.observation.offer.condition,"UNKNOWN");
    assert.equal(promoted.observation.offer.availability,"IN_STOCK");
    assert.equal(promoted.observation.compliance.licenseContext,"DATAFORSEO_GOOGLE_SHOPPING");
    assert.equal(promoted.historicalEligibility.eligible,true);

    const historical = new HistoricalIntelligence();
    const timeline = historical.getTimeline(await observations.getAll(), { atlasProductId:"ram_corsair_cmk32gx5m2b6000z30", currency:"USD", condition:"UNKNOWN" });
    assert.equal(timeline.length,1);
    assert.equal(timeline[0].price,549.99);

    const duplicate = await service.promote({
        evidenceId:retained.evidenceId,
        atlasResolution:{ outcome:"CONFIRMED", atlasProductId:"ram_corsair_cmk32gx5m2b6000z30", evidence:[], automaticMercuryEligible:true },
        merchantResolution:resolvedMerchant,
        createdBy:"df003d-test"
    });
    assert.equal(duplicate.status,"DUPLICATE");
    assert.equal(duplicate.observationId,promoted.observationId);
    assert.equal((await observations.getAll()).length,1);
} finally { await rm(root,{recursive:true,force:true}); }
console.log("DataForSEO historical promotion tests passed.");
