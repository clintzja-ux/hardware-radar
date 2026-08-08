import { validateObservation } from "./ObservationValidator.js";
import { validateProvenance } from "./ProvenanceValidator.js";

const CONFIDENCE_EVIDENCE_SCHEMA_VERSION = "1.0";

function deepFreeze(value) {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
    return value;
}

function adapterIsRegistered(adapterRegistry, adapterId) {
    if (!adapterRegistry || typeof adapterRegistry.has !== "function" || typeof adapterId !== "string" || adapterId.trim() === "") return false;
    try {
        return adapterRegistry.has(adapterId);
    } catch {
        return false;
    }
}

export function deriveConfidenceEvidence(observation, { freshnessResult, adapterRegistry } = {}) {
    const observationReport = validateObservation(observation);
    const provenanceReport = validateProvenance(observation?.provenance, {
        observationTime: observation?.observationTime,
        sourceMethod: observation?.sourceMethod,
        marketplace: observation?.marketplace
    });
    const adapterId = observation?.provenance?.transformation?.adapterId ?? null;
    const registered = adapterIsRegistered(adapterRegistry, adapterId);

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
            status: registered ? "REGISTERED" : "UNREGISTERED",
            adapterId
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
