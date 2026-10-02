import { createCurrentRetailRefreshPortfolio, CurrentRetailRefreshOrchestrator } from "./CurrentRetailRefresh.js";
import { assessRakutenNeweggDestination, createRakutenNeweggProductFeedAdapter } from "./RakutenNeweggProductFeedAdapter.js";
import { projectRakutenCatalogState } from "./RakutenCatalogStateProjection.js";

const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const key = (value, schemaVersion) => schemaVersion === "1.1" ? value.offerIdentity : `${value.atlasProductId}|${value.retailerId}`;

export class ProductionRakutenNeweggCurrentRefreshService {
    constructor({ productRepository, retailerRepository, destinationSourceLoader, destinationSourcePath, snapshotRepository, rightsRegistry } = {}) {
        if (!productRepository?.getAll || !retailerRepository?.getAll || typeof destinationSourceLoader !== "function" || !destinationSourcePath || !snapshotRepository?.getState || !snapshotRepository?.replaceIfCurrent || !rightsRegistry?.require) throw new TypeError("RAKUTEN_CURRENT_REFRESH_COMPOSITION_INVALID");
        Object.assign(this, { productRepository, retailerRepository, destinationSourceLoader, destinationSourcePath, snapshotRepository, rightsRegistry });
    }

    async run({ catalogFiles, feedTimestamp, evaluatedAt, dryRun = true } = {}) {
        if (!Array.isArray(catalogFiles) || !catalogFiles.length || !Number.isFinite(Date.parse(feedTimestamp)) || !Number.isFinite(Date.parse(evaluatedAt)) || typeof dryRun !== "boolean") throw new TypeError("RAKUTEN_CURRENT_REFRESH_INPUT_INVALID");
        const rights = this.rightsRegistry.require("RAKUTEN_NEWEGG_PRODUCT_CATALOG");
        if (rights.acquisition?.import !== "ALLOWED" || rights.processing?.ephemeral !== "ALLOWED" || rights.retention?.current !== "ALLOWED" || rights.retention?.historical === "ALLOWED" || rights.live?.currentObservation !== "ALLOWED" || rights.live?.publicDisplay !== "ALLOWED" || rights.live?.comparison !== "ALLOWED") throw new Error("RAKUTEN_CURRENT_REFRESH_RIGHTS_BLOCKED");
        const [products, retailers, priorState] = await Promise.all([this.productRepository.getAll(), this.retailerRepository.getAll(), this.snapshotRepository.getState()]);
        const destinationSource = await this.destinationSourceLoader({ sourcePath: this.destinationSourcePath, products, retailers });
        const destinations = destinationSource.effective.filter(value => value.retailerId === "RETAILER-0004" && value.status === "ACTIVE");
        const catalogState = projectRakutenCatalogState({ files: catalogFiles, requireLineage: true });
        const productById = new Map(products.map(value => [value.identity?.atlasProductId, value]));
        const rowAssessments = catalogState.currentCandidates.map(({ sourceEntryKey, record }) => {
            const binding = assessRakutenNeweggDestination(record, destinations);
            const product = binding.destination ? productById.get(binding.destination.atlasProductId) : null;
            let classification = "ROUTINE_CANDIDATE";
            if (binding.status === "DESTINATION_NOT_MATCHED") classification = "DESTINATION_NOT_READY";
            else if (binding.status !== "MATCHED" || !product) classification = "IDENTITY_MISMATCH";
            return { sourceEntryKey, productId: record.productId ?? null, sku: record.sku ?? null, atlasProductId: binding.destination?.atlasProductId ?? null, destinationId: binding.destination?.destinationId ?? null, classification, reason: binding.status };
        });
        const byDestination = new Map();
        for (const value of rowAssessments.filter(value => value.classification === "ROUTINE_CANDIDATE")) {
            if (!byDestination.has(value.destinationId)) byDestination.set(value.destinationId, []);
            byDestination.get(value.destinationId).push(value);
        }
        for (const values of byDestination.values()) if (values.length > 1) for (const value of values) { value.classification = "IDENTITY_MISMATCH"; value.reason = "MULTIPLE_SOURCE_ROWS_FOR_DESTINATION"; }
        const candidateIds = new Set(rowAssessments.filter(value => value.classification === "ROUTINE_CANDIDATE").map(value => value.destinationId));
        const candidateDestinations = destinations.filter(value => candidateIds.has(value.destinationId));
        const adapter = createRakutenNeweggProductFeedAdapter({ catalogFiles, destinations: candidateDestinations, feedTimestamp });
        const portfolio = createCurrentRetailRefreshPortfolio({ products, retailers, destinations: candidateDestinations, adapters: [adapter], asOf: evaluatedAt });
        const refresh = await new CurrentRetailRefreshOrchestrator({ adapters: [adapter] }).run({ portfolio, priorSnapshot: priorState.current });
        const priorByKey = new Map((priorState.current?.offers ?? []).map(value => [key(value, priorState.current?.schemaVersion), value]));
        const nextByKey = new Map(refresh.snapshot.offers.map(value => [key(value, refresh.snapshot.schemaVersion), value]));
        const routineUpdates = [...nextByKey].filter(([entryKey, value]) => value.itemPriceEligible === true && !same(priorByKey.get(entryKey), value)).length;
        const unchanged = [...nextByKey].filter(([entryKey, value]) => same(priorByKey.get(entryKey), value)).length;
        const materialChange = !same(priorState.current?.offers ?? [], refresh.snapshot.offers);
        let persistence = { status: dryRun ? "DRY_RUN" : "NO_CHANGE", snapshotId: priorState.current?.snapshotId ?? null, previousSnapshotId: priorState.previous?.snapshotId ?? null };
        if (!dryRun && materialChange) persistence = await this.snapshotRepository.replaceIfCurrent(refresh.snapshot, { expectedCurrentSnapshotId: priorState.current?.snapshotId ?? null, expectedCurrentFingerprint: priorState.current?.materialFingerprint ?? null });
        const count = status => refresh.outcomes.filter(value => value.status === status).length;
        const summary = {
            sourceRowsConsidered: catalogState.currentCandidates.length,
            candidateProducts: new Set(rowAssessments.filter(value => value.atlasProductId).map(value => value.atlasProductId)).size,
            routineCurrentUpdates: routineUpdates,
            unchangedNoOp: unchanged,
            outOfStock: count("OUT_OF_STOCK"),
            destinationNotReady: rowAssessments.filter(value => value.classification === "DESTINATION_NOT_READY").length,
            identityMismatch: rowAssessments.filter(value => value.classification === "IDENTITY_MISMATCH").length + count("INVALID_SOURCE_RESULT"),
            priceSemanticsUnresolved: count("PRICE_SEMANTICS_UNRESOLVED"),
            availabilityUnknown: count("AVAILABILITY_UNKNOWN"),
            sourceConflicts: count("CURRENT_SOURCE_CONFLICT_REVIEW_REQUIRED"),
            rightsBlocked: 0,
            failedSafe: refresh.counts.failed
        };
        const exceptions = [...rowAssessments.filter(value => value.classification !== "ROUTINE_CANDIDATE"), ...refresh.outcomes.filter(value => !["REFRESHED", "CONDITION_UNKNOWN"].includes(value.status)).map(value => ({ atlasProductId: value.atlasProductId, destinationId: value.destinationId, classification: value.status, reason: value.status }))];
        return freeze({ schemaVersion: "1.0", operation: "RAKUTEN_NEWEGG_CURRENT_REFRESH", mode: dryRun ? "DRY_RUN" : "EXECUTE", catalogBindingDigest: catalogState.bindingDigest, portfolioId: portfolio.portfolioId, refreshRunId: refresh.runId, summary, rowAssessments, outcomes: refresh.outcomes, exceptions, snapshot: refresh.snapshot, persistence, historicalObservationsCreated: 0, publicationCandidatesCreated: 0, publicationAuthorizationsCreated: 0, artifactsCreated: 0, providerCalls: 0, paidTasks: 0, actualSpendUsd: 0 });
    }
}
