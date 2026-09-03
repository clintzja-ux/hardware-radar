import { validateObservation } from "./ObservationValidator.js";
import { validateProvenance } from "./ProvenanceValidator.js";

const CONFIDENCE_EVIDENCE_SCHEMA_VERSION = "1.0";

function deepFreeze(value) {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
    return value;
}

export function assessAdapterCompatibility(observation, adapterRegistry) {
    const adapterId = observation?.provenance?.transformation?.adapterId ?? null;
    const adapterVersion = observation?.provenance?.transformation?.adapterVersion ?? null;
    const reasons = [];
    let adapter = null, metadata = null;
    if (!adapterRegistry || typeof adapterRegistry.get !== "function" || typeof adapterId !== "string" || adapterId.trim() === "") reasons.push("ADAPTER_NOT_REGISTERED");
    else {
        try { adapter = adapterRegistry.get(adapterId, { retailerId: observation?.retailerId, marketplace: observation?.marketplace }); } catch { adapter = null; }
        if (!adapter) reasons.push("ADAPTER_NOT_REGISTERED");
    }
    if (adapter) {
        try { metadata = adapter.getMetadata(); } catch { metadata = null; }
        if (metadata?.status !== "ACTIVE") reasons.push("ADAPTER_NOT_ACTIVE");
        if (metadata?.retailerId !== observation?.retailerId) reasons.push("ADAPTER_RETAILER_MISMATCH");
        if (typeof adapter.supportsMarketplace !== "function" || !adapter.supportsMarketplace(observation?.marketplace)) reasons.push("ADAPTER_MARKETPLACE_UNSUPPORTED");
        if (typeof adapter.supportsSourceMethod !== "function" || !adapter.supportsSourceMethod(observation?.sourceMethod)) reasons.push("ADAPTER_SOURCE_METHOD_UNSUPPORTED");
        const compatible = metadata?.compatibleNormalizationVersions ?? [metadata?.version];
        if (typeof adapterVersion !== "string" || !compatible.includes(adapterVersion)) reasons.push("ADAPTER_VERSION_INCOMPATIBLE");
    }
    return deepFreeze({ status: reasons.length === 0 ? "REGISTERED" : "UNREGISTERED", adapterId, adapterVersion, metadata, reasons });
}

export function deriveConfidenceEvidence(observation, { freshnessResult, adapterRegistry } = {}) {
    const observationReport = validateObservation(observation);
    const provenanceReport = validateProvenance(observation?.provenance, {
        observationTime: observation?.observationTime,
        sourceMethod: observation?.sourceMethod,
        marketplace: observation?.marketplace
    });
    const adapterCompatibility = assessAdapterCompatibility(observation, adapterRegistry);

    return deepFreeze({
        schemaVersion: CONFIDENCE_EVIDENCE_SCHEMA_VERSION,
        observationValidation: {
            status: observationReport.valid ? "PASS" : "FAIL",
            issueCount: observationReport.errors.length,
            validatorVersion: observationReport.validatorVersion
        },
        provenanceValidation: {
            status: provenanceReport.valid ? "PASS" : "FAIL",
            issueCount: provenanceReport.errors.length
        },
        adapterRegistration: {
            status: adapterCompatibility.status,
            adapterId: adapterCompatibility.adapterId,
            adapterVersion: adapterCompatibility.adapterVersion,
            metadata: adapterCompatibility.metadata,
            reasons: adapterCompatibility.reasons
        },
        freshness: {
            status: freshnessResult?.status ?? null,
            expired: freshnessResult?.expired ?? null,
            evaluatedAt: freshnessResult?.evaluatedAt ?? null,
            reason: freshnessResult?.reason ?? null,
            policyId: freshnessResult?.policyId ?? null,
            policyVersion: freshnessResult?.policyVersion ?? null
        },
        declaredValidationStatus: observation?.validationStatus ?? null
    });
}

export { CONFIDENCE_EVIDENCE_SCHEMA_VERSION };
export default deriveConfidenceEvidence;
