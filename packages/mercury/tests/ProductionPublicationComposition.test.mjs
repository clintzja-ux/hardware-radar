import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Mercury } from "../Mercury.js";
import adapterRegistry from "../adapters/index.js";
import { CurrentMarketObservationQualificationService } from "../current-market/CurrentMarketObservationQualificationService.js";
import { createProductionFreshnessPolicy, ProductionFreshnessPolicyRepository } from "../current-market/ProductionFreshnessPolicy.js";
import { SourceRightsRegistry, defaultSourceRightsRegistry } from "../rights/SourceRightsRegistry.js";
import { FileObservationAcceptanceRepository } from "../persistence/FileObservationAcceptanceRepository.js";
import { FileReviewDecisionRepository } from "../review/persistence/FileReviewDecisionRepository.js";
import { createReviewDecision } from "../review/ObservationReviewDecision.js";
import { FilePublicationDecisionRepository } from "../publication/persistence/FilePublicationDecisionRepository.js";
import { PublicationWorkflowService } from "../publication/PublicationWorkflowService.js";
import { PublicationAtlasResolver } from "../publication/PublicationAtlasResolver.js";
import { GovernedMarketPublicationService } from "../publication/GovernedMarketPublicationService.js";
import { MarketPublicationService } from "../publication/MarketPublicationService.js";
import { makeObservation } from "./helpers/reviewFixture.mjs";

const product = JSON.parse(await readFile(new URL("../../atlas/products/ram/ddr5/HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000-cl30.json", import.meta.url), "utf8"));
const retailer = JSON.parse(await readFile(new URL("../../atlas/retailers/RETAILER-0002-platinummicro.json", import.meta.url), "utf8"));
const observationId = "mer_obs_000000901";
const observedAt = "2026-08-30T12:00:00Z";
const currentAt = "2026-08-30T12:20:00Z";
const staleAt = "2026-08-30T15:00:00Z";
const atlas = new PublicationAtlasResolver({ products: [product], retailers: [retailer] });
const mercury = new Mercury();

function canonicalObservation({ affiliate = false } = {}) {
    const value = makeObservation(observationId, { sourceMethod: "API", licenseContext: "DATAFORSEO_GOOGLE_SHOPPING", observedAt });
    Object.assign(value, { retailerId: retailer.id, marketplace: "platinummicro.com" });
    value.provenance.source = { name: "DataForSEO Google Shopping", uri: value.offer.sourceUrl, marketplace: value.marketplace };
    value.provenance.acquisition = { method: "API", retrievedAt: observedAt, retrievedBy: "dataforseo", requestId: "task-production-shaped", rawPayloadReference: "fixture:production-composition:item:0" };
    value.provenance.transformation = { adapterId: "mer_adapter_dataforseo_google_shopping", adapterVersion: "1.0.0", normalizedAt: observedAt };
    value.offer.shipping = { costKnown: false, cost: null, currency: null, notes: null };
    value.offer.affiliate = { isAffiliateLink: affiliate, network: affiliate ? "fixture-network" : null, trackingCodePresent: affiliate };
    value.compliance = { licenseContext: "DATAFORSEO_GOOGLE_SHOPPING", requiredDisclosureShown: false, requiredPriceDisclaimerShown: false, retailerContentDisclaimerShown: false };
    value.metadata = { createdAt: observedAt, createdBy: "fixture:mvp002-1", observationHash: null, notes: "Production-shaped fixture only" };
    return value;
}

const freshnessPolicy = createProductionFreshnessPolicy({
    policyId: "fixture-production-publication",
    version: "1.0.0",
    provider: "DATAFORSEO",
    sourceId: "DATAFORSEO_GOOGLE_SHOPPING",
    retailerId: retailer.id,
    marketplace: "platinummicro.com",
    atlasProductIds: [product.identity.atlasProductId],
    currentUntilMs: 30 * 60_000,
    staleAfterMs: 120 * 60_000,
    effectiveAt: "2026-08-30T00:00:00Z",
    approvalBasis: "FIXTURE_ONLY"
});

function qualifier({ acceptance, reviews, policies = [freshnessPolicy], rightsRegistry = defaultSourceRightsRegistry } = {}) {
    return new CurrentMarketObservationQualificationService({
        acceptanceRepository: acceptance,
        reviewRepository: reviews,
        productRepository: { getById: async id => id === product.identity.atlasProductId ? structuredClone(product) : null },
        retailerRepository: { getById: async id => id === retailer.id ? structuredClone(retailer) : null },
        mercury,
        adapterRegistry,
        freshnessPolicyRepository: new ProductionFreshnessPolicyRepository({ policies }),
        rightsRegistry
    });
}

function workflow({ acceptance, reviews, publications, qualification = null, required = true } = {}) {
    return new PublicationWorkflowService({ acceptanceRepository: acceptance, reviewRepository: reviews, publicationRepository: publications, mercury, atlas, currentMarketQualificationService: qualification, requireCurrentMarketQualification: required });
}

function projector(owner, required = true) {
    return new GovernedMarketPublicationService({ workflowService: owner, marketPublicationService: new MarketPublicationService({ mercury }), requireCurrentMarketQualification: required });
}

const root = await mkdtemp(path.join(os.tmpdir(), "hardware-radar-production-publication-"));
try {
    const acceptance = new FileObservationAcceptanceRepository({ statePath: path.join(root, "canonical.json"), environment: "development", now: () => observedAt });
    await acceptance.accept(canonicalObservation(), "fixture-production-composition");
    const reviews = new FileReviewDecisionRepository({ statePath: path.join(root, "reviews.json"), acceptanceRepository: acceptance, environment: "development", now: () => "2026-08-30T12:10:00Z" });
    const review = await reviews.recordDecision(createReviewDecision({ observationId, decision: "REVIEWED", reviewedBy: "operator:fixture", reviewedAt: "2026-08-30T12:10:00Z" }));
    const publications = new FilePublicationDecisionRepository({ statePath: path.join(root, "publications.json"), acceptanceRepository: acceptance, reviewRepository: reviews, environment: "development", now: () => currentAt });
    const e2s = qualifier({ acceptance, reviews });
    const owner = workflow({ acceptance, reviews, publications, qualification: e2s });

    const beforePublish = await projector(owner).createSnapshot({ products: [product], retailers: [retailer], generatedAt: currentAt });
    assert.equal(beforePublish.scopes.overall.status, "INSUFFICIENT_DATA", "Canonical admission and REVIEWED remain insufficient without PUBLISH.");

    await owner.authorizePublish({ observationId, authorizedBy: "operator:fixture", authorizedAt: currentAt });
    const current = await projector(owner).createSnapshot({ products: [product], retailers: [retailer], generatedAt: currentAt });
    assert.equal(current.scopes.overall.status, "AVAILABLE");
    assert.equal(current.scopes.overall.cheapest.observationId, observationId);
    assert.equal((await e2s.assess({ observationId, evaluatedAt: currentAt })).status, "CURRENT_MARKET_QUALIFIED");

    const replay = await projector(owner).createSnapshot({ products: [product], retailers: [retailer], generatedAt: currentAt });
    assert.deepEqual(replay, current, "Identical repositories and evaluation time must produce an identical snapshot.");

    const stale = await projector(owner).createSnapshot({ products: [product], retailers: [retailer], generatedAt: staleAt });
    const staleAssessment = await e2s.assess({ observationId, evaluatedAt: staleAt });
    assert.equal(staleAssessment.status, "CURRENT_MARKET_NOT_QUALIFIED");
    assert.ok(staleAssessment.reasons.includes("FRESHNESS_NOT_ELIGIBLE"));
    assert.equal(stale.scopes.overall.status, "INSUFFICIENT_DATA", "Effective PUBLISH must not freeze dynamic freshness.");
    assert.equal((await publications.getEffectiveDecision(observationId)).action, "PUBLISH", "Dynamic exclusion must preserve append-only publication history.");

    for (const reasons of [
        ["FRESHNESS_NOT_ELIGIBLE"],
        ["CONDITION_NOT_ELIGIBLE"],
        ["CONFIDENCE_NOT_ELIGIBLE"],
        ["SOURCE_RIGHT_BLOCKED"]
    ]) {
        const blockedOwner = workflow({ acceptance, reviews, publications, qualification: { assess: async () => ({ observationId, qualified: false, status: "CURRENT_MARKET_NOT_QUALIFIED", reasons, freshness: { status: reasons[0] === "FRESHNESS_NOT_ELIGIBLE" ? "STALE" : "CURRENT" }, confidence: { status: reasons[0] === "CONFIDENCE_NOT_ELIGIBLE" ? "LOW" : "HIGH" }, condition: reasons[0] === "CONDITION_NOT_ELIGIBLE" ? "UNKNOWN" : "NEW" }) } });
        const blocked = await projector(blockedOwner).createSnapshot({ products: [product], retailers: [retailer], generatedAt: currentAt });
        assert.equal(blocked.scopes.overall.status, "INSUFFICIENT_DATA", `${reasons[0]} must exclude an effective PUBLISH.`);
    }

    const noPolicyOwner = workflow({ acceptance, reviews, publications, qualification: qualifier({ acceptance, reviews, policies: [] }) });
    const noPolicyAssessment = await noPolicyOwner.evaluate(observationId, { asOf: currentAt });
    assert.ok(noPolicyAssessment.reasons.includes("PRODUCTION_FRESHNESS_POLICY_MISSING"));
    assert.equal((await projector(noPolicyOwner).createSnapshot({ products: [product], retailers: [retailer], generatedAt: currentAt })).scopes.overall.status, "INSUFFICIENT_DATA");

    const profile = structuredClone(defaultSourceRightsRegistry.require("DATAFORSEO_GOOGLE_SHOPPING"));
    profile.live.publicDisplay = "BLOCKED";
    const rightsOwner = workflow({ acceptance, reviews, publications, qualification: qualifier({ acceptance, reviews, rightsRegistry: new SourceRightsRegistry({ sourceProfiles: { DATAFORSEO_GOOGLE_SHOPPING: profile } }) }) });
    assert.ok((await rightsOwner.evaluate(observationId, { asOf: currentAt })).reasons.includes("SOURCE_RIGHT_BLOCKED"));
    assert.equal((await projector(rightsOwner).createSnapshot({ products: [product], retailers: [retailer], generatedAt: currentAt })).scopes.overall.status, "INSUFFICIENT_DATA");

    const legacyOwner = workflow({ acceptance, reviews, publications, qualification: null, required: false });
    assert.equal((await projector(legacyOwner, true).createSnapshot({ products: [product], retailers: [retailer], generatedAt: currentAt })).scopes.overall.status, "INSUFFICIENT_DATA", "Production projection must not fall back when E2S composition is missing.");
    const requiredWithoutOwner = workflow({ acceptance, reviews, publications, qualification: null, required: true });
    assert.ok((await requiredWithoutOwner.evaluate(observationId, { asOf: currentAt })).reasons.includes("CURRENT_MARKET_QUALIFICATION_SERVICE_REQUIRED"));

    const missingReviewWorkflow = new PublicationWorkflowService({ acceptanceRepository: acceptance, reviewRepository: { getEffectiveDecision: async () => null }, publicationRepository: publications, mercury, atlas, currentMarketQualificationService: { assess: async () => ({ observationId, qualified: true, reasons: [] }) }, requireCurrentMarketQualification: true });
    assert.ok((await missingReviewWorkflow.evaluate(observationId, { asOf: currentAt })).reasons.includes("REVIEW_REQUIRED"));

    const productionShaped = { assess: async () => ({ observationId, qualified: false, status: "CURRENT_MARKET_NOT_QUALIFIED", reasons: ["FRESHNESS_NOT_ELIGIBLE", "CONFIDENCE_NOT_ELIGIBLE", "CONDITION_NOT_ELIGIBLE"], freshness: { status: "AGING" }, confidence: { status: "MEDIUM" }, condition: "UNKNOWN" }) };
    const productionShapedOwner = workflow({ acceptance, reviews, publications, qualification: productionShaped });
    assert.equal((await projector(productionShapedOwner).createSnapshot({ products: [product], retailers: [retailer], generatedAt: currentAt })).scopes.overall.status, "INSUFFICIENT_DATA");

    const affiliateCandidate = { observation: canonicalObservation({ affiliate: true }), product, retailer, currentMarketQualification: await e2s.assess({ observationId, evaluatedAt: currentAt }) };
    const nonAffiliateCandidate = { ...affiliateCandidate, observation: canonicalObservation({ affiliate: false }) };
    const market = new MarketPublicationService({ mercury });
    const affiliateSnapshot = await market.createSnapshot({ observations: [], qualifiedCandidates: [affiliateCandidate], products: [product], retailers: [retailer], generatedAt: currentAt });
    const nonAffiliateSnapshot = await market.createSnapshot({ observations: [], qualifiedCandidates: [nonAffiliateCandidate], products: [product], retailers: [retailer], generatedAt: currentAt });
    assert.deepEqual(affiliateSnapshot, nonAffiliateSnapshot, "Affiliate metadata must not influence qualification or ranking output.");

    assert.equal("publicationDecisionId" in current.scopes.overall.cheapest, false);
    assert.equal("reviewDecisionId" in current.scopes.overall.cheapest, false);
    assert.equal("currentPriceAuthority" in current.scopes.overall.cheapest, false);
    assert.equal(review.reviewDecisionId.startsWith("mer_rev_"), true);

    const buildSource = await readFile(new URL("../../../scripts/build-public.mjs", import.meta.url), "utf8");
    assert.match(buildSource, /CurrentMarketObservationQualificationService/);
    assert.match(buildSource, /requireCurrentMarketQualification: true/);
    assert.doesNotMatch(buildSource, /currentMarketQualificationService:\s*null/);

    console.log("Production E2S publication composition tests passed.");
} finally {
    await rm(root, { recursive: true, force: true });
}
