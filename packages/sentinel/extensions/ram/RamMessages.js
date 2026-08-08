/**
 * Sentinel RAM Message Catalog
 *
 * Canonical messages, titles and remediation guidance
 * for RAM validation rules.
 */

export const RamMessages = {

    "ATL-RAM-001": {
        title: "Capacity Invariant",
        pass: "Module capacity matches total capacity.",
        fail: "Total capacity does not equal module count × capacity per module.",
        remediation: "Correct capacityGb or moduleCount/capacityPerModuleGb so the invariant is satisfied."
    },

    "ATL-RAM-002": {
        title: "Canonical MPN Uniqueness",
        pass: "Manufacturer part number is unique.",
        fail: "Manufacturer part number already exists.",
        remediation: "Resolve duplicate canonical product."
    },

    "ATL-RAM-003": {
        title: "Stable Product Identity",
        pass: "Product identity is stable.",
        fail: "Product identity changed unexpectedly.",
        remediation: "Review canonical identifier generation."
    },

    "ATL-RAM-004": {
        title: "Speed Label Consistency",
        pass: "Marketing speed label matches transfer rate.",
        fail: "Marketing speed label conflicts with transfer rate.",
        remediation: "Correct the marketing speed label."
    },

    "ATL-RAM-005": {
        title: "Kit Consistency",
        pass: "Kit configuration is internally consistent.",
        fail: "Kit metadata conflicts with module count.",
        remediation: "Correct kit metadata."
    },

    "ATL-RAM-006": {
        title: "ECC Classification",
        pass: "ECC classification validated.",
        fail: "ECC classification lacks sufficient supporting evidence.",
        remediation: "Provide authoritative manufacturer documentation."
    },

    "ATL-RAM-007": {
        title: "Retailer Data Isolation",
        pass: "No retailer-specific data detected.",
        fail: "Retailer-specific fields were found inside Atlas.",
        remediation: "Move retailer and pricing data into Mercury."
    },

    "ATL-RAM-008": {
        title: "Required Provenance",
        pass: "Required provenance supplied.",
        fail: "Required provenance is missing.",
        remediation: "Add authoritative provenance before publication."
    },

    "ATL-RAM-009": {
        title: "Unknown Value Integrity",
        pass: "Unknown values use the canonical representation.",
        fail: "Invalid placeholder value detected.",
        remediation: "Replace placeholder with the canonical unknown value."
    },

    "ATL-RAM-010": {
        title: "Lifecycle Consistency",
        pass: "Lifecycle metadata is internally consistent.",
        fail: "Lifecycle metadata is inconsistent.",
        remediation: "Correct lifecycle information."
    },

    "ATL-RAM-011": {
        title: "Timing Integrity",
        pass: "Timing values are internally consistent.",
        fail: "Timing values are invalid or incomplete.",
        remediation: "Correct timing fields."
    },

    "ATL-RAM-012": {
        title: "Unit Normalization",
        pass: "Measurement units are normalized.",
        fail: "Unexpected measurement units detected.",
        remediation: "Normalize all units to Atlas standards."
    },

    "ATL-RAM-013": {
        title: "Overclock Profile Evidence",
        pass: "Overclock profile verified.",
        fail: "Missing supporting XMP or EXPO evidence.",
        remediation: "Provide manufacturer evidence for the overclock profile."
    },

    "ATL-RAM-014": {
        title: "Source Conflict Resolution",
        pass: "No authoritative source conflicts detected.",
        fail: "Conflicting authoritative sources detected.",
        remediation: "Resolve conflicting sources before publication."
    }

};

export default RamMessages;