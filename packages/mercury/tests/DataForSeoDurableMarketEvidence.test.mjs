import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
    FileDataForSeoMarketEvidenceRepository,
    createDataForSeoMarketObservationCandidate,
    evaluateDataForSeoObservationEligibility,
    resolveDataForSeoMerchantIdentity
} from "../index.js";
import { normalizeDataForSeoSellerEvidence } from "../adapters/dataforseo/DataForSeoSellerNormalizer.js";

const root = await mkdtemp(join(tmpdir(), "hardware-radar-df003d-evidence-"));
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
    const candidate = createDataForSeoMarketObservationCandidate({ marketEvidence:evidence, atlasResolution:{ outcome:"PROBABLE", atlasProductId:"ram_corsair_cmk32gx5m2b6000z30", evidence:[], automaticMercuryEligible:false } });
    const merchant = resolveDataForSeoMerchantIdentity({ marketEvidence:evidence, retailers:[] });
    const eligibility = evaluateDataForSeoObservationEligibility({ candidate, merchantResolution:merchant });
    const repo = new FileDataForSeoMarketEvidenceRepository({ statePath:join(root,"evidence.json"), now:()=>"2026-08-16T06:00:00Z" });

    const first = await repo.retain({ candidate, merchantResolution:merchant, eligibility });
    assert.equal(first.status,"RETAINED");
    assert.match(first.evidenceId,/^dfev_[0-9a-f]{24}$/);
    const stored = await repo.getById(first.evidenceId);
    assert.equal(stored.candidate.marketEvidence.pricing.basePrice,549.99);
    assert.equal(stored.candidate.marketEvidence.pricing.shippingPrice,38.260695);
    assert.equal(stored.candidate.marketEvidence.pricing.tax,null);
    assert.equal(stored.candidate.marketEvidence.pricing.totalPrice,588.25);
    assert.equal(stored.candidate.identity.outcome,"PROBABLE");
    assert.equal(stored.merchantResolution.outcome,"DISCOVERED");
    assert.equal(stored.retainedAt,"2026-08-16T06:00:00Z");

    const second = await repo.retain({ candidate, merchantResolution:merchant, eligibility });
    assert.equal(second.status,"DUPLICATE");
    assert.equal(second.evidenceId,first.evidenceId);
    assert.equal((await repo.getAll()).length,1);
    await assert.rejects(() => repo.retain({ candidate, merchantResolution:merchant, eligibility:{...eligibility,rawEvidenceRetentionEligible:false} }), /RETENTION_NOT_ALLOWED/);
} finally { await rm(root,{recursive:true,force:true}); }
console.log("DataForSEO durable market evidence tests passed.");
