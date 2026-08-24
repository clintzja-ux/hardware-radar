import path from "node:path";
import { FileDataForSeoMarketEvidenceRepository, FileIdentityReviewDecisionRepository, assessDataForSeoEvidencePromotion, governHistoricalRefreshIdentityReuse } from "../packages/mercury/index.js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { RetailerRepository } from "../packages/atlas/index.js";

async function readLocalJson(resource) { return JSON.parse(await readFile(fileURLToPath(resource), "utf8")); }

const args = new Map(process.argv.slice(2).map((entry) => {
    const index = entry.indexOf("=");
    return index < 0 ? [entry, true] : [entry.slice(0, index), entry.slice(index + 1)];
}));
const statePath = path.resolve(String(args.get("--state") || process.env.HARDWARE_RADAR_DATAFORSEO_EVIDENCE_STATE || ".forge-review/acquisition/dataforseo-market-evidence.json"));
const decisionStatePath = path.resolve(String(args.get("--decision-state") || ".forge-review/identity-review/identity-review-decisions.json"));
const requestedProduct = String(args.get("--atlas-product") || "ram_corsair_cmk32gx5m2b6000z30");
const usesProductionEvidenceDefault=!args.has("--state")&&!process.env.HARDWARE_RADAR_DATAFORSEO_EVIDENCE_STATE;const reuseStatePath=args.has("--reuse-state")?path.resolve(String(args.get("--reuse-state"))):usesProductionEvidenceDefault?path.resolve(".forge-review/acquisition/historical-refresh-result-latest.json"):null;const refreshPlanStatePath=args.has("--refresh-plan-state")?path.resolve(String(args.get("--refresh-plan-state"))):usesProductionEvidenceDefault?path.resolve(".forge-review/acquisition/historical-refresh-plan.json"):null;
const repository = new FileDataForSeoMarketEvidenceRepository({ statePath });
const decisionRepository = new FileIdentityReviewDecisionRepository({ statePath:decisionStatePath, requireExisting:true });
const records = (await repository.getAll()).filter((record) => record.candidate?.identity?.atlasProductId === requestedProduct);
const identityReviewDecisions = await decisionRepository.getAll();
const identityReviewRemediations = await decisionRepository.getAllRemediations();
const atlasRetailers = await new RetailerRepository({ readJson:readLocalJson }).getAll();
const identityReuseAssessments=[];if(reuseStatePath&&refreshPlanStatePath){try{const refreshResult=JSON.parse(await readFile(reuseStatePath,"utf8")),refreshPlan=JSON.parse(await readFile(refreshPlanStatePath,"utf8"));for(const reuse of refreshResult.identityReuse??[]){const sourceRecord=records.find(x=>x.evidenceId===reuse.sourceEvidenceId)??await repository.getById(reuse.sourceEvidenceId),targetRecord=records.find(x=>x.evidenceId===reuse.targetEvidenceId)??await repository.getById(reuse.targetEvidenceId);identityReuseAssessments.push(governHistoricalRefreshIdentityReuse({assessment:reuse,refreshResult,refreshPlan,sourceRecord,targetRecord}));}}catch(error){if(error?.code!=="ENOENT")throw error;}}
const assessment = assessDataForSeoEvidencePromotion({ records, identityReviewDecisions, identityReviewRemediations, atlasRetailers, identityReuseAssessments });

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
