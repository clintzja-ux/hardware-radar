import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {ProductRepository,RetailerRepository} from "../packages/atlas/index.js";
import {CertifiedMercuryOperationsExporter,FileDataForSeoMarketEvidenceRepository,FileHistoricalObservationRepository,FileIdentityReviewDecisionRepository,FileObservationAcceptanceRepository,FilePublicationDecisionRepository,FileReviewDecisionRepository,HistoricalRefreshCadencePolicyRepository,ObservationRepository,resolveHistoricalRefreshAdmissionGovernance} from "../packages/mercury/index.js";

const args=new Map(process.argv.slice(2).map(value=>{const index=value.indexOf("=");return index<0?[value,true]:[value.slice(0,index),value.slice(index+1)];})),asOf=args.get("--as-of");if(typeof asOf!=="string"||!Number.isFinite(Date.parse(asOf)))throw new Error("--as-of=<ISO_TIMESTAMP> is required");
const root=path.resolve(".forge-review"),acquisition=path.join(root,"acquisition"),mercury=path.join(root,"mercury");
const location=(argument,fallback)=>path.resolve(String(args.get(argument)||fallback));
const paths={
 evidence:location("--evidence-state",path.join(acquisition,"dataforseo-market-evidence.json")),
 history:location("--history-state",path.join(mercury,"historical-observations.json")),
 identity:location("--identity-state",path.join(root,"identity-review","identity-review-decisions.json")),
 acceptance:location("--acceptance-state",path.join(mercury,"observation-acceptance.json")),
 review:location("--review-state",path.join(mercury,"review-decisions.json")),
 publication:location("--publication-state",path.join(mercury,"publication-decisions.json")),
 plan:location("--refresh-plan-state",path.join(acquisition,"historical-refresh-plan.json")),
 authorization:location("--refresh-authorization-state",path.join(acquisition,"historical-refresh-authorization-request.json")),
 execution:location("--execution-state",path.join(acquisition,"execution-ledger.json")),
 consumption:location("--consumption-state",path.join(acquisition,"live-authorization-consumptions.json")),
 result:location("--refresh-result-state",path.join(acquisition,"historical-refresh-result-latest.json")),
 output:location("--output",path.join(root,"forge","certified-mercury-operations.json"))
};
const readJson=async resource=>JSON.parse(await readFile(resource instanceof URL?fileURLToPath(resource):resource,"utf8")),readOptional=async(file,fallback)=>{try{return JSON.parse(await readFile(file,"utf8"));}catch(error){if(error?.code==="ENOENT")return structuredClone(fallback);throw error;}};
const productRepository=new ProductRepository({readJson}),retailerRepository=new RetailerRepository({readJson}),evidenceRepository=new FileDataForSeoMarketEvidenceRepository({statePath:paths.evidence}),historicalRepository=new FileHistoricalObservationRepository({statePath:paths.history}),identityDecisionRepository=new FileIdentityReviewDecisionRepository({statePath:paths.identity,requireExisting:true}),canonicalObservationRepository=new ObservationRepository({readJson}),acceptanceRepository=new FileObservationAcceptanceRepository({statePath:paths.acceptance,environment:"production"}),reviewRepository=new FileReviewDecisionRepository({statePath:paths.review,acceptanceRepository,environment:"production"}),publicationRepository=new FilePublicationDecisionRepository({statePath:paths.publication,acceptanceRepository,reviewRepository,environment:"production"}),cadencePolicyRepository=new HistoricalRefreshCadencePolicyRepository({atlasProductRepository:productRepository});
const operationalContextProvider={load:async({evidenceRecords})=>{const [plan,authorization,execution,consumption,result]=await Promise.all([readOptional(paths.plan,null),readOptional(paths.authorization,null),readOptional(paths.execution,{schemaVersion:"1.0",runs:[]}),readOptional(paths.consumption,{schemaVersion:"1.0",consumed:[]}),readOptional(paths.result,null)]),identityReuseAssessments=[];if(result&&plan)for(const reuse of result.identityReuse??[]){const targetRecord=evidenceRecords.find(record=>record.evidenceId===reuse.targetEvidenceId);if(!targetRecord)throw new Error("CERTIFIED_MERCURY_EXPORT_REUSE_EVIDENCE_MISSING");const governed=await resolveHistoricalRefreshAdmissionGovernance({targetRecord,evidenceRepository,refreshResult:result,refreshPlan:plan});identityReuseAssessments.push(...governed.identityReuseAssessments);}return {refreshPlans:plan?[plan]:[],authorizations:authorization?[authorization]:[],executionRuns:execution.runs??[],consumptionState:consumption,refreshResults:result?[result]:[],identityReuseAssessments};}};
const exported=await new CertifiedMercuryOperationsExporter({productRepository,retailerRepository,evidenceRepository,historicalRepository,identityDecisionRepository,canonicalObservationRepository,reviewRepository,publicationRepository,cadencePolicyRepository,operationalContextProvider}).export({asOf,outputPath:paths.output});
console.log("CERTIFIED MERCURY OPERATIONS EXPORT");console.log("");console.log("As of:                  ",exported.projection.asOf);console.log("Artifact:               ",exported.artifactPath);console.log("Atlas products:         ",exported.projection.products.length);console.log("Historical semantics:  ",exported.projection.semantics.historicalValueSemantics);console.log("Source state modified:  NO");console.log("Network operation:      NONE");console.log("Paid task created:      NO");console.log("Actual spend:           $0.000");
