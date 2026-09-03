import path from "node:path";
import {FileDataForSeoMarketEvidenceRepository,FileIdentityReviewDecisionRepository,IdentityReviewService} from "../packages/mercury/index.js";

const args=new Map(process.argv.slice(2).map(x=>{const i=x.indexOf("=");return i<0?[x,true]:[x.slice(0,i),x.slice(i+1)];}));
const required=name=>{const value=args.get(name);if(typeof value!=="string"||value.trim()==="")throw new Error(`${name.slice(2).replaceAll("-","_").toUpperCase()}_REQUIRED`);return value.trim();};
const decisionId=required("--decision-id");const confirmationToken=required("--confirm");const reviewedBy=required("--reviewed-by");const reason=required("--reason");
const evidencePath=path.resolve(String(args.get("--evidence-state")||".forge-review/acquisition/dataforseo-market-evidence.json"));const decisionsPath=path.resolve(String(args.get("--decision-state")||".forge-review/identity-review/identity-review-decisions.json"));
const evidenceRepository=new FileDataForSeoMarketEvidenceRepository({statePath:evidencePath});const decisionRepository=new FileIdentityReviewDecisionRepository({statePath:decisionsPath,requireExisting:true});const service=new IdentityReviewService({evidenceRepository,decisionRepository});
const remediation=await service.remediateReviewerAudit({decisionId,confirmationToken,correctedReviewedBy:reviewedBy,reason,remediatedAt:new Date().toISOString(),remediatedBy:reviewedBy});
console.log("IDENTITY REVIEW AUDIT REMEDIATION");console.log("Original decision ID:  ",remediation.originalDecisionId);console.log("Remediation ID:        ",remediation.identityReviewRemediationId);console.log("Subject:               ",remediation.subjectType);console.log("Original reviewer:     ",remediation.originalReviewedBy);console.log("Corrected reviewer:    ",remediation.correctedReviewedBy);console.log("Original changed:       NO");console.log("Promotion authorized:   NO");console.log("Paid task created:      NO");console.log("Actual spend:           $0.000");
