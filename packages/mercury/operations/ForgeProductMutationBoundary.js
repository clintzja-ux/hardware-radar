import { validateProduct, validateRepository } from "../../atlas/ProductValidator.js";

const consequential = new Set(["CREATE_PRODUCT", "EDIT_PRODUCT", "TRANSITION_LIFECYCLE", "ADD_DESTINATION", "SUPERSEDE_DESTINATION", "RETIRE_DESTINATION", "ADD_AFFILIATE", "REPLACE_AFFILIATE", "DISABLE_AFFILIATE"]);

export class ForgeProductMutationBoundary {
    constructor({ productRepository, destinationRepository, affiliateOwner, auditRepository } = {}) {
        this.productRepository = productRepository; this.destinationRepository = destinationRepository; this.affiliateOwner = affiliateOwner; this.auditRepository = auditRepository;
    }
    async assess({ action, operator, authenticated = false, product = null } = {}) {
        if (!consequential.has(action)) throw new Error("FORGE_PRODUCT_ACTION_UNSUPPORTED");
        if (!authenticated || !operator) return Object.freeze({ status: "UNAUTHORIZED", executable: false, reasons: ["AUTHENTICATED_OPERATOR_REQUIRED"] });
        if (product) {
            const report = validateProduct(product);
            if (!report.valid) return Object.freeze({ status: "INVALID", executable: false, reasons: report.errors.map(value => value.code) });
            const capacity = product.extension?.data?.capacity;
            if (capacity?.capacityGb !== capacity?.moduleCount * capacity?.capacityPerModuleGb) return Object.freeze({ status: "INVALID", executable: false, reasons: ["ATLAS_CAPACITY_INVARIANT_FAILED"] });
            const existing = await this.productRepository?.getAll?.() ?? [];
            const repositoryReport = validateRepository([...existing.filter(value => value.identity.atlasProductId !== product.identity.atlasProductId), product]);
            if (!repositoryReport.valid) return Object.freeze({ status: "INVALID", executable: false, reasons: repositoryReport.errors.map(value => value.code) });
        }
        const owner = action.includes("DESTINATION") ? this.destinationRepository : action.includes("AFFILIATE") ? this.affiliateOwner : this.productRepository;
        if (!owner || !this.auditRepository) return Object.freeze({ status: "RUNTIME_NOT_CONNECTED", executable: false, reasons: ["CANONICAL_MUTATION_OWNER_OR_AUDIT_RUNTIME_UNAVAILABLE"] });
        return Object.freeze({ status: "READY_FOR_GOVERNED_EXECUTION", executable: true, reasons: [], confirmationRequired: true });
    }
}

export default ForgeProductMutationBoundary;
