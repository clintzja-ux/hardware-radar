import path from "node:path";
import { FileDataForSeoMarketEvidenceRepository, assessDataForSeoEvidencePromotion } from "../packages/mercury/index.js";

const args = new Map(process.argv.slice(2).map((entry) => {
    const index = entry.indexOf("=");
    return index < 0 ? [entry, true] : [entry.slice(0, index), entry.slice(index + 1)];
}));
const statePath = path.resolve(String(args.get("--state") || process.env.HARDWARE_RADAR_DATAFORSEO_EVIDENCE_STATE || ".forge-review/acquisition/dataforseo-market-evidence.json"));
const requestedProduct = String(args.get("--atlas-product") || "ram_corsair_cmk32gx5m2b6000z30");
const repository = new FileDataForSeoMarketEvidenceRepository({ statePath });
const records = (await repository.getAll()).filter((record) => record.candidate?.identity?.atlasProductId === requestedProduct);
const assessment = assessDataForSeoEvidencePromotion({ records });

console.log("EVIDENCE PROMOTION ASSESSMENT");
console.log("");
console.log("Atlas product:          ", assessment.atlasProductId ?? requestedProduct);
console.log("Product identity:       ", assessment.productIdentity ?? "UNKNOWN");
console.log("Merchant identity:      ", assessment.merchantIdentity ?? "UNKNOWN");
console.log("Evidence count:         ", assessment.evidenceCount);
console.log("Promotion state:        ", assessment.state);
console.log("");
console.log("Historical eligible:    ", assessment.historicalEligible);
console.log("Canonical eligible:     ", assessment.canonicalEligible);
console.log("Publication eligible:   ", assessment.publicationEligible);
console.log("");
console.log("Reasons:                ", JSON.stringify(assessment.reasons));
console.log("Paid task created:      NO");
console.log("Actual spend:           $0.000");
