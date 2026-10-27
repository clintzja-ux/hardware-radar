import { assessNeweggAffiliatePublicAction } from "../current-display/NeweggAffiliatePublicAction.js";

const clone = value => structuredClone(value);
const freeze = value => {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const child of Object.values(value)) freeze(child);
    }
    return value;
};
const text = value => typeof value === "string" && value.trim() ? value.trim() : null;

function currentProductIds(snapshot) {
    const offers = snapshot?.offers ?? snapshot?.products ?? [];
    return new Set(offers.map(value => value?.atlasProductId).filter(Boolean));
}

function historyCounts(observations) {
    const counts = new Map();
    for (const observation of observations) {
        if (!observation?.atlasProductId) continue;
        counts.set(observation.atlasProductId, (counts.get(observation.atlasProductId) ?? 0) + 1);
    }
    return counts;
}

function destinationProjection({ productId, records, effective, affiliateRow }) {
    const productRecords = records.filter(value => value.atlasProductId === productId);
    return effective.filter(value => value.atlasProductId === productId).map(destination => {
        const versions = productRecords
            .filter(value => value.retailerId === destination.retailerId && value.marketplace === destination.marketplace)
            .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)));
        let affiliate = { status: "NOT_CONFIGURED", url: null, publicActionPrecedence: false, reasons: [] };
        if (destination.retailerId === "RETAILER-0004" && affiliateRow?.rakutenRouting?.affiliateUrl) {
            const assessment = assessNeweggAffiliatePublicAction({ row: affiliateRow, destination });
            affiliate = {
                status: assessment.eligible ? "READY" : "REVIEW_REQUIRED",
                url: affiliateRow.rakutenRouting.affiliateUrl,
                publicActionPrecedence: assessment.eligible,
                reasons: clone(assessment.reasons),
                checkedAt: affiliateRow.rakutenRouting.checkedAt ?? null,
                provenance: "OPERATOR_SUPPLIED_RAKUTEN_NEWEGG_LINK"
            };
        }
        return {
            destinationId: destination.destinationId,
            retailerId: destination.retailerId,
            marketplace: destination.marketplace,
            url: destination.destinationUrl,
            listingId: destination.retailerListingId,
            status: destination.status,
            reviewMethod: destination.binding?.method ?? null,
            reviewedAt: destination.reviewedAt ?? null,
            reviewedBy: destination.reviewedBy ?? null,
            versionCount: versions.length,
            versions: clone(versions),
            affiliate,
            linkHealth: { status: "NOT_CHECKED", checkedAt: null, finalUrl: null, reasons: [] }
        };
    });
}

export function createForgeProductManagerProjection({ asOf, products, brands = [], retailers = [], destinationSource, currentSnapshot = null, historicalObservations = [], affiliateRows = [] } = {}) {
    if (!Number.isFinite(Date.parse(asOf)) || !Array.isArray(products) || !Array.isArray(retailers) || destinationSource?.schemaVersion !== "1.0" || !Array.isArray(destinationSource.records) || !Array.isArray(destinationSource.effective) || !Array.isArray(historicalObservations) || !Array.isArray(affiliateRows)) {
        throw new TypeError("FORGE_PRODUCT_MANAGER_SOURCE_INVALID");
    }
    const currentIds = currentProductIds(currentSnapshot), history = historyCounts(historicalObservations), affiliates = new Map(affiliateRows.map(row => [row.atlasProductId, row]));
    const items = [...products].sort((left, right) => left.identity.atlasProductId.localeCompare(right.identity.atlasProductId)).map(product => {
        const id = product.identity.atlasProductId, destinations = destinationProjection({ productId: id, records: destinationSource.records, effective: destinationSource.effective, affiliateRow: affiliates.get(id) });
        const data = product.extension?.data ?? {}, capacity = data.capacity ?? {}, classification = data.classification ?? {};
        return {
            atlasProductId: id,
            brand: product.identity.brand,
            manufacturer: product.identity.manufacturer,
            manufacturerPartNumber: product.identity.manufacturerPartNumber,
            displayName: product.identity.displayName,
            slug: product.identity.slug,
            lifecycleStatus: product.governance.lifecycleStatus,
            publicationStatus: product.governance.publicationStatus,
            recordRevision: product.identity.recordRevision,
            specifications: clone(data),
            facets: {
                memoryType: classification.memoryType ?? null,
                formFactor: classification.formFactor ?? null,
                capacityGb: capacity.capacityGb ?? null,
                moduleCount: capacity.moduleCount ?? null,
                capacityPerModuleGb: capacity.capacityPerModuleGb ?? null
            },
            capacityInvariantValid: Number(capacity.capacityGb) === Number(capacity.moduleCount) * Number(capacity.capacityPerModuleGb),
            destinations,
            retailerCoverage: [...new Set(destinations.map(value => value.retailerId))].sort(),
            current: { available: currentIds.has(id) },
            history: { available: (history.get(id) ?? 0) > 0, observationCount: history.get(id) ?? 0 },
            issues: [
                ...(destinations.length ? [] : ["RETAILER_DESTINATION_MISSING"]),
                ...(!Number(capacity.capacityGb) || Number(capacity.capacityGb) !== Number(capacity.moduleCount) * Number(capacity.capacityPerModuleGb) ? ["CAPACITY_INVARIANT_INVALID"] : []),
                ...destinations.filter(value => value.affiliate.status === "REVIEW_REQUIRED").map(() => "AFFILIATE_REVIEW_REQUIRED")
            ]
        };
    });
    return freeze({
        schemaVersion: "1.0",
        projectionType: "FORGE_PRODUCT_MANAGER",
        asOf,
        summary: {
            productCount: items.length,
            destinationCount: destinationSource.effective.length,
            productsWithCurrent: items.filter(value => value.current.available).length,
            productsWithHistory: items.filter(value => value.history.available).length,
            productsMissingDestinations: items.filter(value => !value.destinations.length).length
        },
        manufacturers: brands.map(brand=>({brandId:brand.brandId,displayName:brand.displayName,aliases:clone(brand.aliases??[])})).sort((a,b)=>a.displayName.localeCompare(b.displayName)),
        retailers: retailers.filter(retailer=>retailer.status==="active").map(retailer=>({retailerId:retailer.id,name:retailer.name,marketplace:new URL(retailer.websiteUrl).hostname.replace(/^www\./,"").toLowerCase()})).sort((a,b)=>a.name.localeCompare(b.name)),
        products: items,
        capabilities: {
            catalogInspection: true,
            destinationInspection: true,
            affiliateInspection: true,
            linkHealthInspection: true,
            productMutation: false,
            destinationMutation: false,
            affiliateMutation: false,
            linkVerificationExecution: false,
            blockedBy: "AUTHENTICATED_TRUSTED_OPERATOR_RUNTIME_NOT_CONNECTED"
        },
        semantics: {
            atlasCanonical: true,
            mercuryDestinationsCanonical: true,
            affiliateIndependentFromRanking: true,
            browserMutationProhibited: true
        },
        readOnly: true,
        mutationAuthorized: false,
        networkOperation: "NONE"
    });
}

export default createForgeProductManagerProjection;
