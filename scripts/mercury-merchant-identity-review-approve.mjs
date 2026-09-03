import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {FileDataForSeoMarketEvidenceRepository,FileIdentityReviewDecisionRepository,IdentityReviewService} from "../packages/mercury/index.js";
import {RetailerRepository} from "../packages/atlas/index.js";

const readLocalJson=async resource=>JSON.parse(await readFile(fileURLToPath(resource),"utf8"));

const args=new Map(process.argv.slice(2).map(x=>{const i=x.indexOf("=");return i<0?[x,true]:[x.slice(0,i),x.slice(i+1)];}));
const required=name=>{const value=args.get(name);if(typeof value!=="string"||value.trim()==="")throw new Error(`${name.slice(2).replaceAll("-","_").toUpperCase()}_REQUIRED`);return value;};
const requestId=required("--request-id");const confirmationToken=required("--confirm");const reviewedBy=required("--reviewed-by");const reason=required("--reason");const contradictionStatus=required("--contradiction-status");const canonicalDomain=required("--domain");const merchantId=required("--merchant-id");
const requestPath=path.resolve(String(args.get("--request")||`.forge-review/identity-review/merchant-${canonicalDomain}.json`));const evidencePath=path.resolve(String(args.get("--evidence-state")||".forge-review/acquisition/dataforseo-market-evidence.json"));const decisionsPath=path.resolve(String(args.get("--decision-state")||".forge-review/identity-review/identity-review-decisions.json"));
const request=JSON.parse(await readFile(requestPath,"utf8"));const evidenceRepository=new FileDataForSeoMarketEvidenceRepository({statePath:evidencePath});const decisionRepository=new FileIdentityReviewDecisionRepository({statePath:decisionsPath});const retailerRepository=new RetailerRepository({readJson:readLocalJson});const service=new IdentityReviewService({evidenceRepository,decisionRepository,retailerRepository});
const decision=await service.approvePreparedMerchantRequest({request,requestId,confirmationToken,reviewedBy,reason,contradictionStatus,reviewedAt:new Date().toISOString(),canonicalDomain,merchantId});
console.log("MERCHANT IDENTITY REVIEW APPROVAL");console.log("Request ID:             ",requestId);console.log("Decision ID:            ",decision.identityReviewDecisionId);console.log("Merchant:               ",decision.canonicalMerchantName);console.log("Merchant ID:            ",decision.merchantId);console.log("Canonical domain:       ",decision.canonicalDomain);console.log("Transition:             ",`${decision.previousState} -> ${decision.requestedState}`);console.log("Outcome:                ",decision.decisionOutcome);console.log("Retained evidence changed: NO");console.log("Promotion authorized:   NO");console.log("Paid task created:      NO");console.log("Actual spend:           $0.000");
