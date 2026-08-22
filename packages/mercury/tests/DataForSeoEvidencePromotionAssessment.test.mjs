import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
    assessDataForSeoEvidencePromotion,
    EVIDENCE_PROMOTION_STATES,
    FileDataForSeoMarketEvidenceRepository
} from "../index.js";

function record(overrides = {}) {
    const candidate = {
        candidateVersion:"1.0",
        candidateType:"MERCURY_MARKET_OBSERVATION",
        marketEvidence:{
            evidenceVersion:"1.0", provider:"DATAFORSEO", source:"DATAFORSEO_GOOGLE_SHOPPING", sourceMethod:"API",
            seller:{name:"Platinummicro",domain:"platinummicro.com",url:"https://platinummicro.com/item"},
            pricing:{basePrice:588.99,shippingPrice:null,tax:null,totalPrice:588.99,currency:"USD"},
            offer:{condition:null,details:"Corsair CMK32GX5M2B6000Z30",availability:"in_stock"},
            productEvidence:{title:"Corsair CMK32GX5M2B6000Z30",dataDocId:"3844868436216882408",productId:null,gid:null},
            provenance:{sourceTaskId:"08211631-2304-0183-0000-2f47e4410471",observedAt:"2026-08-21T16:31:45.604Z",rawPayloadReference:"fixture:e2g"}
        },
        identity:{outcome:"PROBABLE",atlasProductId:"ram_corsair_cmk32gx5m2b6000z30",externalProductId:null,candidateAtlasProductIds:[],evidence:[]},
        governance:{requiresReview:true,canonicalObservationEligible:false,automaticPublicationEligible:false}
    };
    return {
        evidenceId:"dfev_e2g_fixture", evidenceVersion:"1.0", retainedAt:"2026-08-22T06:28:10.013Z", idempotencyKey:"fixture-key",
        candidate,
        merchantResolution:{resolutionVersion:"1.0",outcome:"DISCOVERED",retailerId:null,merchantKey:"domain:platinummicro.com",sellerName:"Platinummicro",canonicalDomain:"platinummicro.com",suppliedDomain:"platinummicro.com",urlDomain:"platinummicro.com",requiresRegistration:true,evidence:[],reason:"ATLAS_RETAILER_NOT_FOUND"},
        eligibilityAtRetention:{eligibilityVersion:"1.0",status:"REVIEW_REQUIRED",canonicalObservationEligible:false,rawEvidenceRetentionEligible:true,historicalAnalyticsEligible:false,retailerId:null,requiresReview:true,reasons:["MERCHANT_REGISTRATION_REQUIRED"]},
        ...overrides
    };
}

const current = record();
const snapshot = structuredClone(current);
const first = assessDataForSeoEvidencePromotion({ records:[current] });
assert.equal(first.state, EVIDENCE_PROMOTION_STATES.REVIEW_REQUIRED);
assert.equal(first.historicalEligible, false);
assert.equal(first.canonicalEligible, false);
assert.equal(first.publicationEligible, false);
assert.equal(first.productIdentity, "PROBABLE");
assert.equal(first.merchantIdentity, "DISCOVERED");
assert.equal(first.independentAcquisitionCycles, 1);
assert.ok(first.reasons.some((entry) => entry.code === "MERCHANT_REGISTRATION_REQUIRED"));

const contradictory = record({ merchantResolution:{...current.merchantResolution,outcome:"CONFLICT",reason:"SELLER_DOMAIN_URL_CONFLICT"} });
assert.equal(assessDataForSeoEvidencePromotion({ records:[contradictory] }).state, EVIDENCE_PROMOTION_STATES.BLOCKED);
assert.equal(assessDataForSeoEvidencePromotion({ records:[{ evidenceId:"broken" }] }).state, EVIDENCE_PROMOTION_STATES.BLOCKED);

const incomplete = assessDataForSeoEvidencePromotion({});
assert.equal(incomplete.state, EVIDENCE_PROMOTION_STATES.EVIDENCE_ONLY);
assert.equal(incomplete.historicalEligible, false);
assert.equal(incomplete.canonicalEligible, false);
assert.equal(incomplete.publicationEligible, false);

assert.deepEqual(assessDataForSeoEvidencePromotion({ records:[current] }), first);
assert.deepEqual(current, snapshot);

const bypass = record({ eligibilityAtRetention:{...current.eligibilityAtRetention,status:"ELIGIBLE",canonicalObservationEligible:true,historicalAnalyticsEligible:true,reasons:[]} });
const bypassAssessment = assessDataForSeoEvidencePromotion({ records:[bypass] });
assert.equal(bypassAssessment.state, EVIDENCE_PROMOTION_STATES.BLOCKED);
assert.ok(bypassAssessment.reasons.some((entry) => entry.code === "DF003_ELIGIBILITY_CONTRADICTION"));

const root = await mkdtemp(join(tmpdir(), "hardware-radar-e2g-cli-"));
try {
    const statePath = join(root, "evidence.json");
    const repository = new FileDataForSeoMarketEvidenceRepository({ statePath });
    await repository.retain({ candidate:current.candidate, merchantResolution:current.merchantResolution, eligibility:current.eligibilityAtRetention });
    const output = execFileSync(process.execPath, ["scripts/mercury-evidence-promotion-assess.mjs", `--state=${statePath}`], { cwd:process.cwd(), encoding:"utf8" });
    assert.match(output, /EVIDENCE PROMOTION ASSESSMENT/);
    assert.match(output, /Promotion state:\s+REVIEW_REQUIRED/);
    assert.match(output, /Paid task created:\s+NO/);
    assert.match(output, /Actual spend:\s+\$0\.000/);
} finally {
    await rm(root, { recursive:true, force:true });
}

console.log("DataForSEO evidence promotion assessment tests passed.");
