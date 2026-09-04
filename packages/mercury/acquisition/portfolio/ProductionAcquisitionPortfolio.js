import crypto from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { AcquisitionPortfolioPrepareService, projectAcquisitionPortfolio } from "./AcquisitionPortfolio.js";
import { readGovernedSpendForUtcDay } from "../planning/GovernedDailySpend.js";

const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${stable(value[k])}`).join(",")}}`:JSON.stringify(value);
const hash=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const clone=value=>structuredClone(value);

export class GovernedProviderIdentityResolver {
  constructor({ historicalRepository, evidenceRepository }={}) { if(!historicalRepository?.getAll||!evidenceRepository?.getById)throw new TypeError("PROVIDER_IDENTITY_OWNER_REQUIRED");this.history=historicalRepository;this.evidence=evidenceRepository; }
  async resolve(atlasProductId) {
    const observations=(await this.history.getAll()).filter(x=>x.atlasProductId===atlasProductId&&x.provenance?.provider==="DATAFORSEO"&&x.provenance?.source==="DATAFORSEO_GOOGLE_SHOPPING");
    if(!observations.length)return freeze({status:"ABSENT"});
    const identities=[];
    for(const observation of observations){const record=await this.evidence.getById(observation.provenance?.retainedEvidenceId);if(!record)throw new Error(`PORTFOLIO_GOVERNED_EVIDENCE_MISSING:${observation.observationId}`);const market=record.candidate?.marketEvidence;if(market?.provider!=="DATAFORSEO"||market?.source!=="DATAFORSEO_GOOGLE_SHOPPING"||market?.provenance?.sourceTaskId!==observation.provenance?.acquisition?.sellersTaskId)throw new Error("PORTFOLIO_PROVIDER_IDENTITY_BINDING_INVALID");const id={productId:market.productEvidence?.productId??null,dataDocId:market.productEvidence?.dataDocId??null,gid:market.productEvidence?.gid??null};if(!Object.values(id).some(v=>typeof v==="string"&&v))throw new Error("PORTFOLIO_PROVIDER_IDENTITY_ABSENT_FROM_GOVERNED_EVIDENCE");identities.push({id,observationId:observation.observationId,evidenceId:record.evidenceId});}
    const unique=new Map(identities.map(x=>[stable(x.id),x.id]));if(unique.size!==1)return freeze({status:"REVIEW_REQUIRED",reason:"CONFLICTING_GOVERNED_PROVIDER_IDENTITIES"});
    const id=[...unique.values()][0];return freeze({status:"REUSABLE",...id,bindingDigest:hash({atlasProductId,identities})});
  }
}

export class FileAcquisitionPortfolioRepository {
  constructor({rootPath}={}){if(!rootPath)throw new TypeError("rootPath required");this.root=path.resolve(rootPath);}
  artifactPath(id){if(typeof id!=="string"||!/^mer_acqportfolio_[a-f0-9]{24}$/.test(id))throw new Error("ACQUISITION_PORTFOLIO_ID_INVALID");return path.join(this.root,id,"prepare.json");}
  async getById(id){try{return freeze(JSON.parse(await readFile(this.artifactPath(id),"utf8")));}catch(e){if(e?.code==="ENOENT")return null;throw e;}}
  async persist(portfolio){const target=this.artifactPath(portfolio?.portfolioCycleId),existing=await this.getById(portfolio.portfolioCycleId);if(existing){if(stable(existing)!==stable(portfolio))throw new Error("ACQUISITION_PORTFOLIO_IMMUTABLE_CONFLICT");return freeze({status:"DUPLICATE",portfolio:existing,artifactPath:target});}await mkdir(path.dirname(target),{recursive:true});const temp=`${target}.${process.pid}.tmp`;await writeFile(temp,`${JSON.stringify(portfolio,null,2)}\n`,"utf8");await rename(temp,target);return freeze({status:"PREPARED",portfolio:clone(portfolio),artifactPath:target});}
}

export class ProductionAcquisitionPortfolioPrepareService {
  constructor({atlas,rightsRegistry,providerIdentityResolver,executionRepository,portfolioRepository}={}){if(!executionRepository?.getAll||!portfolioRepository?.persist)throw new TypeError("PRODUCTION_PORTFOLIO_OWNER_REQUIRED");this.executionRepository=executionRepository;this.repository=portfolioRepository;this.domain=new AcquisitionPortfolioPrepareService({atlas,rightsRegistry,providerIdentityResolver});}
  async prepare({asOf,locationName="United States",languageName="English"}={}){const spend=await readGovernedSpendForUtcDay({executionRepository:this.executionRepository,evaluationTime:asOf});const portfolio=await this.domain.prepare({asOf,locationName,languageName,currentUtcDaySpendUsd:spend});const persisted=await this.repository.persist(portfolio);return freeze({...persisted,report:projectAcquisitionPortfolio({portfolio:persisted.portfolio,currentUtcDaySpendUsd:spend})});}
  async validate(portfolio){
    if(!portfolio?.asOf||portfolio.schemaVersion!=="1.0"||portfolio.authority!=="ACQUISITION_ORCHESTRATION_AUTHORITY"||!Array.isArray(portfolio.eligibleProducts)||!Array.isArray(portfolio.excludedProducts))throw new Error("ACQUISITION_PORTFOLIO_INVALID");
    const binding={policyVersion:portfolio.policyVersion,asOf:portfolio.asOf,atlasInventoryDigest:portfolio.atlasInventoryDigest,sourceRightsProfileDigest:portfolio.sourceRightsProfileDigest,provider:portfolio.provider,sourceId:portfolio.sourceId,endpointFamily:portfolio.endpointFamily,locationName:portfolio.locationName,languageName:portfolio.languageName,eligibleProducts:portfolio.eligibleProducts,excludedProducts:portfolio.excludedProducts,taskEnvelope:portfolio.taskEnvelope,costEnvelope:portfolio.costEnvelope,automaticPaidRetries:portfolio.automaticPaidRetries};
    const bindingDigest=hash(binding),cycleId=`mer_acqportfolio_${hash({bindingDigest}).slice(0,24)}`;
    const productIds=[...portfolio.eligibleProducts,...portfolio.excludedProducts].map(item=>item?.atlasProductId),maximumTasks=portfolio.eligibleProducts.reduce((sum,item)=>sum+item.maximumRemainingPaidTasks,0),maximumSpend=portfolio.eligibleProducts.reduce((sum,item)=>Math.round((sum+item.maximumRemainingSpendUsd+Number.EPSILON)*1e9)/1e9,0),falseAuthorities=portfolio.downstreamAuthority&&Object.values(portfolio.downstreamAuthority).every(value=>value===false);
    if(bindingDigest!==portfolio.bindingDigest||cycleId!==portfolio.portfolioCycleId||portfolio.portfolioType!=="DATAFORSEO_RAM_ACQUISITION_PORTFOLIO"||portfolio.preparedAt!==portfolio.asOf||portfolio.authorizationState!=="NOT_AUTHORIZED"||portfolio.portfolioReviewState!=="NOT_REVIEWED"||portfolio.currentProgressState!=="NOT_STARTED"||portfolio.mutationAuthorized!==false||portfolio.providerSpendAuthorized!==false||portfolio.paidTaskCreated!==false||portfolio.networkOperation!=="NONE"||portfolio.actualSpendUsd!==0||!falseAuthorities||new Set(productIds).size!==productIds.length||portfolio.counts?.eligible!==portfolio.eligibleProducts.length||portfolio.counts?.excluded!==portfolio.excludedProducts.length||portfolio.counts?.canonicalProducts!==productIds.length||portfolio.taskEnvelope?.maximumProgramTaskCount!==maximumTasks||portfolio.costEnvelope?.maximumProgramSpendUsd!==maximumSpend)throw new Error("ACQUISITION_PORTFOLIO_IMMUTABLE_BINDING_INVALID");
    const currentProducts=[...await this.domain.atlas.products.getAll()].sort((a,b)=>String(a?.identity?.atlasProductId).localeCompare(String(b?.identity?.atlasProductId))),currentInventoryDigest=hash(currentProducts.map(product=>({atlasProductId:product?.identity?.atlasProductId,manufacturerPartNumber:product?.identity?.manufacturerPartNumber,recordRevision:product?.identity?.recordRevision,lifecycleStatus:product?.governance?.lifecycleStatus,publicationStatus:product?.governance?.publicationStatus,engineeringValidationStatus:product?.governance?.engineeringValidationStatus})));
    const spend=await readGovernedSpendForUtcDay({executionRepository:this.executionRepository,evaluationTime:portfolio.asOf});
    return freeze({valid:true,portfolio:clone(portfolio),atlasDriftSincePrepare:currentInventoryDigest!==portfolio.atlasInventoryDigest,currentAtlasInventoryDigest:currentInventoryDigest,report:projectAcquisitionPortfolio({portfolio,currentUtcDaySpendUsd:spend})});
  }
}
