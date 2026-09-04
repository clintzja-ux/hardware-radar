import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  AcquisitionPortfolioPrepareService, PORTFOLIO_EVENT_TYPES, PORTFOLIO_PRODUCT_STATES,
  projectAcquisitionPortfolio, assertAcquisitionPortfolioBindingCurrent, assessDestinationCandidate, acknowledgeAcquisitionPortfolio,
  defaultSourceRightsRegistry
} from "../index.js";

let cases = 0;
const asOf = "2026-09-03T12:00:00.000Z";
const manifest = JSON.parse(await readFile(new URL("../../atlas/atlas-manifest.json", import.meta.url), "utf8"));
const atlasProducts = await Promise.all(manifest.products.map(async entry => JSON.parse(await readFile(new URL(`../../atlas/${entry.path}`, import.meta.url), "utf8"))));
const atlas = { products: { getAll: async () => structuredClone(atlasProducts) } };
const reusable = new Map([
  ["ram_corsair_cmk32gx5m2b6000z30", { status: "REUSABLE", productId: null, dataDocId: "3844868436216882408", gid: null, bindingDigest: "a".repeat(64) }],
  ["ram_crucial_cp2k16g56c46u5", { status: "REUSABLE", productId: "crucial-provider-product", dataDocId: "crucial-data-doc", gid: null, bindingDigest: "b".repeat(64) }]
]);
const resolver = { resolve: async id => structuredClone(reusable.get(id) ?? null) };
const service = new AcquisitionPortfolioPrepareService({ atlas, rightsRegistry: defaultSourceRightsRegistry, providerIdentityResolver: resolver });
const portfolio = await service.prepare({ asOf });
const again = await service.prepare({ asOf });

assert.deepEqual(portfolio, again); cases++;
assert(Object.isFrozen(portfolio) && Object.isFrozen(portfolio.eligibleProducts)); cases++;
assert.equal(portfolio.counts.canonicalProducts, 103); cases++;
assert.equal(portfolio.counts.eligible, 11); cases++;
assert.equal(portfolio.counts.excluded, 92); cases++;
assert.equal(portfolio.eligibleProducts.filter(item => item.providerIdentityState === "REUSABLE").length, 2); cases++;
assert.equal(portfolio.eligibleProducts.filter(item => item.initialState === PORTFOLIO_PRODUCT_STATES.READY_FOR_PRODUCTS).length, 9); cases++;
assert.deepEqual(portfolio.taskEnvelope, { products: 9, productInfo: 9, sellers: 11, maximumProgramTaskCount: 29 }); cases++;
assert.equal(portfolio.costEnvelope.maximumProgramSpendUsd, .029); cases++;
assert.equal(portfolio.costEnvelope.utcDaySpendCeilingUsd, .01); cases++;
assert.equal(portfolio.costEnvelope.maxTasksPerUtcDay, 10); cases++;
assert.equal(portfolio.costEnvelope.minimumUtcDayCapacityEnvelopes, 3); cases++;
assert.equal(portfolio.automaticPaidRetries, 0); cases++;
assert.equal(portfolio.providerSpendAuthorized, false); cases++;
assert.equal(portfolio.networkOperation, "NONE"); cases++;
assert(portfolio.excludedProducts.every(item => item.reason === "ATLAS_PRODUCT_NOT_ACTIVE_READY")); cases++;

const newProduct = portfolio.eligibleProducts.find(item => item.initialState === PORTFOLIO_PRODUCT_STATES.READY_FOR_PRODUCTS).atlasProductId;
const reuseProduct = "ram_corsair_cmk32gx5m2b6000z30";
const event = (eventId, atlasProductId, type, extra = {}) => ({ eventId, portfolioCycleId: portfolio.portfolioCycleId, atlasProductId, type, recordedAt: asOf, ...extra });
const auth = (id, product, operation) => event(id, product, PORTFOLIO_EVENT_TYPES.TASK_AUTHORIZED, { operation, maximumSpendUsd: .001, authorizationId: `liveauth_${id}`, authorizationStatus: "LIVE_AUTHORIZED", authorizationExpiresAt: "2026-09-03T12:15:00.000Z" });
const full = [
  auth("a1", newProduct, "PRODUCTS"), event("p1", newProduct, PORTFOLIO_EVENT_TYPES.PRODUCTS_POSTED, { operation: "PRODUCTS", actualSpendUsd: .001 }),
  event("r1", newProduct, PORTFOLIO_EVENT_TYPES.PRODUCTS_RESOLVED), auth("a2", newProduct, "PRODUCT_INFO"),
  event("p2", newProduct, PORTFOLIO_EVENT_TYPES.PRODUCT_INFO_POSTED, { operation: "PRODUCT_INFO", actualSpendUsd: .001 }), event("r2", newProduct, PORTFOLIO_EVENT_TYPES.PRODUCT_INFO_VALIDATED),
  auth("a3", newProduct, "SELLERS"), event("p3", newProduct, PORTFOLIO_EVENT_TYPES.SELLERS_POSTED, { operation: "SELLERS", actualSpendUsd: .001 }), event("r3", newProduct, PORTFOLIO_EVENT_TYPES.SELLERS_RETRIEVED)
];
const report = projectAcquisitionPortfolio({ portfolio, events: full, currentUtcDaySpendUsd: .003 });
assert.equal(report.products.find(item => item.atlasProductId === newProduct).state, PORTFOLIO_PRODUCT_STATES.ACQUISITION_COMPLETE); cases++;
assert.equal(report.taskState.posted, 3); cases++;
assert.equal(report.spend.actualIncurredSpendUsd, .003); cases++;
assert.equal(report.providerSpendAuthorized, false); cases++;
assert.equal(report.downstreamAuthority.retention, false); cases++;
assert.deepEqual(report, projectAcquisitionPortfolio({ portfolio, events: full, currentUtcDaySpendUsd: .003 })); cases++;

const ambiguous = [auth("amb-a", newProduct, "PRODUCTS"), event("amb-p", newProduct, PORTFOLIO_EVENT_TYPES.PRODUCTS_POSTED, { operation: "PRODUCTS", actualSpendUsd: .001 }), event("amb-r", newProduct, PORTFOLIO_EVENT_TYPES.PRODUCTS_REVIEW_REQUIRED)];
assert.equal(projectAcquisitionPortfolio({ portfolio, events: ambiguous }).products.find(item => item.atlasProductId === newProduct).state, PORTFOLIO_PRODUCT_STATES.PRODUCTS_REVIEW_REQUIRED); cases++;
const noProducts = [auth("np-a", newProduct, "PRODUCTS"), event("np-p", newProduct, PORTFOLIO_EVENT_TYPES.PRODUCTS_POSTED, { operation: "PRODUCTS" }), event("np-r", newProduct, PORTFOLIO_EVENT_TYPES.PRODUCTS_NO_RESULT)];
assert.equal(projectAcquisitionPortfolio({ portfolio, events: noProducts }).products.find(item => item.atlasProductId === newProduct).state, PORTFOLIO_PRODUCT_STATES.NO_RESULT); cases++;
const piFail = full.slice(0, 5).concat(event("pi-f", newProduct, PORTFOLIO_EVENT_TYPES.TASK_FAILED));
assert.equal(projectAcquisitionPortfolio({ portfolio, events: piFail }).products.find(item => item.atlasProductId === newProduct).retryRequiresOperatorAction, true); cases++;
const noSellers = full.slice(0, 8).concat(event("ns", newProduct, PORTFOLIO_EVENT_TYPES.SELLERS_NO_RESULT));
assert.equal(projectAcquisitionPortfolio({ portfolio, events: noSellers }).productOutcomes.noResult, 1); cases++;
const reuseEvents = [auth("rs-a", reuseProduct, "SELLERS"), event("rs-p", reuseProduct, PORTFOLIO_EVENT_TYPES.SELLERS_POSTED, { operation: "SELLERS", actualSpendUsd: .001 }), event("rs-r", reuseProduct, PORTFOLIO_EVENT_TYPES.SELLERS_RETRIEVED)];
assert.equal(projectAcquisitionPortfolio({ portfolio, events: reuseEvents }).products.find(item => item.atlasProductId === reuseProduct).state, PORTFOLIO_PRODUCT_STATES.ACQUISITION_COMPLETE); cases++;
assert.throws(() => projectAcquisitionPortfolio({ portfolio, events: [event("bad", newProduct, PORTFOLIO_EVENT_TYPES.PRODUCT_INFO_POSTED, { operation: "PRODUCT_INFO" })] }), /SEQUENCE_INVALID/); cases++;
assert.throws(() => projectAcquisitionPortfolio({ portfolio, events: [event("no-auth", newProduct, PORTFOLIO_EVENT_TYPES.PRODUCTS_POSTED, { operation: "PRODUCTS" })] }), /WITHOUT_SINGLE_TASK_AUTHORIZATION/); cases++;
assert.throws(() => projectAcquisitionPortfolio({ portfolio, events: [auth("same", newProduct, "PRODUCTS"), auth("same", reuseProduct, "SELLERS")] }), /REPLAY_CONFLICT/); cases++;
assert.equal(projectAcquisitionPortfolio({ portfolio, events: [auth("dup", newProduct, "PRODUCTS"), auth("dup", newProduct, "PRODUCTS")] }).taskState.authorized, 1); cases++;
assert.throws(() => projectAcquisitionPortfolio({ portfolio, events: [auth("over-a", newProduct, "PRODUCTS"), event("over-p", newProduct, PORTFOLIO_EVENT_TYPES.PRODUCTS_POSTED, { operation: "PRODUCTS", actualSpendUsd: .002 })] }), /TASK_COST_CEILING_EXCEEDED/); cases++;
const expired = auth("expired", newProduct, "PRODUCTS"); expired.authorizationExpiresAt = asOf;
assert.throws(() => projectAcquisitionPortfolio({ portfolio, events: [expired] }), /TASK_AUTHORIZATION_INVALID/); cases++;
assert(projectAcquisitionPortfolio({ portfolio, currentUtcDaySpendUsd: .01 }).blockers.includes("UTC_DAY_SPEND_CEILING_EXHAUSTED")); cases++;
assert.throws(() => projectAcquisitionPortfolio({ portfolio, events: [event("excluded", portfolio.excludedProducts[0].atlasProductId, PORTFOLIO_EVENT_TYPES.PRODUCTS_POSTED, { operation: "PRODUCTS" })] }), /EXCLUDED_OR_UNKNOWN/); cases++;

assert.equal(await assertAcquisitionPortfolioBindingCurrent({ portfolio, atlas, rightsRegistry: defaultSourceRightsRegistry }), true); cases++;
const originalProducts = await atlas.products.getAll(), drifted = structuredClone(originalProducts); drifted[0].governance.lifecycleStatus = "DRAFT";
await assert.rejects(() => assertAcquisitionPortfolioBindingCurrent({ portfolio, atlas: { products: { getAll: async () => drifted } }, rightsRegistry: defaultSourceRightsRegistry }), /ATLAS_DRIFT/); cases++;
const changedRights = structuredClone(defaultSourceRightsRegistry.get("DATAFORSEO_GOOGLE_SHOPPING")); changedRights.status = "CHANGED";
await assert.rejects(() => assertAcquisitionPortfolioBindingCurrent({ portfolio, atlas, rightsRegistry: { get: () => changedRights } }), /RIGHTS_DRIFT/); cases++;

const destinations = JSON.parse(await readFile(new URL("../destinations/production-destinations.json", import.meta.url), "utf8")).records;
const existing = destinations[0];
const retailerResolution = { outcome: "RESOLVED", retailerId: existing.retailerId };
assert.equal(assessDestinationCandidate({ sourceUrl: `${existing.destinationUrl}?utm_source=test`, atlasProductId: existing.atlasProductId, retailerResolution, marketplace: existing.marketplace, destinations }).status, "ALREADY_COVERED"); cases++;
assert.equal(assessDestinationCandidate({ sourceUrl: "https://amazon.com/dp/DIFFERENT", atlasProductId: existing.atlasProductId, retailerResolution, marketplace: existing.marketplace, destinations }).status, "CANDIDATE_REVIEW_REQUIRED"); cases++;
assert.equal(assessDestinationCandidate({ sourceUrl: "https://unknown.example/product/1", atlasProductId: existing.atlasProductId, retailerResolution: { outcome: "DISCOVERED", retailerId: null }, marketplace: "unknown.example", destinations }).status, "RETAILER_IDENTITY_REQUIRED"); cases++;
assert.equal(assessDestinationCandidate({ sourceUrl: "not-a-url", atlasProductId: existing.atlasProductId, retailerResolution, marketplace: existing.marketplace, destinations }).status, "URL_REJECTED"); cases++;
const serialized = JSON.stringify(portfolio);
assert(!/password|credential|token/i.test(serialized)); cases++;
assert.equal(portfolio.counts.canonicalProducts, (await atlas.products.getAll()).length); cases++;
const acknowledgment = acknowledgeAcquisitionPortfolio({ portfolio, reviewedBy: "operator:fixture", reviewedAt: asOf, reason: "Review bounded fixture portfolio." });
assert.equal(acknowledgment.status, "PORTFOLIO_REVIEWED"); assert.equal(acknowledgment.providerSpendAuthorized, false); assert.equal(acknowledgment.paidTaskAuthorized, false); cases++;
assert.deepEqual(acknowledgment, acknowledgeAcquisitionPortfolio({ portfolio, reviewedBy: "operator:fixture", reviewedAt: asOf, reason: "Review bounded fixture portfolio." })); cases++;

console.log(`Acquisition portfolio orchestration tests passed: ${cases} cases.`);
