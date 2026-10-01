import {createHash} from "node:crypto";
import {createRamCatalogProjection} from "../../atlas/RamCatalogProjection.js";
import {deriveCurrentDisplayPublicationFacts,currentDisplayPublicationDigest,verifyCurrentDisplayArtifactAuthority} from "./CurrentDisplayPublication.js";
import {renderRamProductPage} from "../../../scripts/ram-product-publishing.mjs";

export const CURRENT_DISPLAY_ARTIFACT_TYPE="AUTHORIZED_CURRENT_DISPLAY_PUBLICATION_ARTIFACT";
export const CURRENT_DISPLAY_ARTIFACT_SCHEMA_VERSION="1.0";
const canonical=v=>`${JSON.stringify(v,null,2)}\n`;
const sha=v=>createHash("sha256").update(v,"utf8").digest("hex");
const freeze=v=>{if(v&&typeof v==="object"&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x);}return v;};

export function verifyCurrentDisplayPublicationArtifact({artifact,authorization,candidate,evaluatedAt}={}){
 try{
  if(artifact?.artifactType!==CURRENT_DISPLAY_ARTIFACT_TYPE||artifact.schemaVersion!==CURRENT_DISPLAY_ARTIFACT_SCHEMA_VERSION||artifact.status!=="MATERIALIZED_VERIFIED"||artifact.releaseAuthority!==false||artifact.deploymentAuthority!==false)return false;
  if(artifact.authorization.authorizationId!==authorization.authorizationId||artifact.authorization.authorizationDigest!==authorization.authorizationDigest||artifact.candidate.candidateId!==candidate.candidateId||artifact.candidate.candidateDigest!==candidate.candidateDigest)return false;
  if(artifact.lineage.snapshotId!==authorization.binding.snapshotId||artifact.lineage.snapshotDigest!==authorization.binding.snapshotDigest||artifact.lineage.projectionDigest!==authorization.binding.projectionDigest||artifact.lineage.publicFactsDigest!==authorization.binding.publicFactsDigest)return false;
  if(artifact.scope.atlasProductId!==authorization.binding.atlasProductId||artifact.scope.claimClass!==authorization.binding.claimClass||artifact.scope.publicationScope!==authorization.binding.publicationScope||artifact.expiresAt!==authorization.binding.expiresAt)return false;
  if(artifact.files.projection.digestSha256!==sha(artifact.content.projectionText)||artifact.files.productPage.digestSha256!==sha(artifact.content.productPageHtml))return false;
  const projection=JSON.parse(artifact.content.projectionText);if(!verifyCurrentDisplayArtifactAuthority({authorization,artifactProjection:projection,evaluatedAt}))return false;
  const material={authorization:artifact.authorization,candidate:artifact.candidate,lineage:artifact.lineage,scope:artifact.scope,publicFacts:artifact.publicFacts,excludedClaims:artifact.excludedClaims,disclosure:artifact.disclosure,expiresAt:artifact.expiresAt,files:artifact.files};
  return artifact.artifactDigest===currentDisplayPublicationDigest(material)&&artifact.artifactId===`mer_displaypubart_${artifact.artifactDigest.slice(0,24)}`;
 }catch{return false;}
}

export class CurrentDisplayPublicationArtifactService{
 constructor({publicationRepository,artifactRepository,snapshotRepository,products,retailers,destinations,rightsRegistry,now=()=>new Date().toISOString(),renderer=renderRamProductPage}={}){Object.assign(this,{publicationRepository,artifactRepository,snapshotRepository,products,retailers,destinations,rightsRegistry,now,renderer});}
 async materialize({authorizationId,builtBy,builtAt=this.now()}={}){
  if(!authorizationId||!builtBy||!Number.isFinite(Date.parse(builtAt)))throw new TypeError("CURRENT_DISPLAY_ARTIFACT_INPUT_INVALID");
  const authorization=await this.publicationRepository.getAuthorization(authorizationId);if(!authorization)throw new Error("CURRENT_DISPLAY_ARTIFACT_AUTHORIZATION_NOT_FOUND");
  const candidate=await this.publicationRepository.getCandidate(authorization.binding?.candidateId);if(!candidate)throw new Error("CURRENT_DISPLAY_ARTIFACT_CANDIDATE_NOT_FOUND");
  if(Date.parse(builtAt)>Date.parse(authorization.binding.expiresAt))throw new Error("CURRENT_DISPLAY_ARTIFACT_AUTHORIZATION_EXPIRED");
  const snapshot=(await this.snapshotRepository.getState()).current;if(!snapshot||snapshot.snapshotId!==authorization.binding.snapshotId)throw new Error("CURRENT_DISPLAY_ARTIFACT_SNAPSHOT_DRIFT");
  const derived=deriveCurrentDisplayPublicationFacts({snapshot,products:this.products,retailers:this.retailers,destinations:this.destinations,rightsRegistry:this.rightsRegistry,atlasProductId:authorization.binding.atlasProductId,evaluatedAt:builtAt});
  if(derived.snapshotDigest!==authorization.binding.snapshotDigest||derived.publicFactsDigest!==authorization.binding.publicFactsDigest)throw new Error("CURRENT_DISPLAY_ARTIFACT_REPREPARE_REQUIRED");
  if(!verifyCurrentDisplayArtifactAuthority({authorization,artifactProjection:candidate.projection,evaluatedAt:builtAt}))throw new Error("CURRENT_DISPLAY_ARTIFACT_AUTHORITY_INVALID");
  const catalogProduct=createRamCatalogProjection(this.products).products.find(x=>x.atlasProductId===authorization.binding.atlasProductId);if(!catalogProduct)throw new Error("CURRENT_DISPLAY_ARTIFACT_PRODUCT_NOT_FOUND");
  const projectionText=canonical(candidate.projection),productPageHtml=this.renderer(catalogProduct,authorization.binding.publicFacts.offers.map(x=>({atlasProductId:authorization.binding.atlasProductId,retailerDisplayName:x.retailerName,destinationUrl:x.destinationUrl})),candidate.projection.products[0],candidate.projection.disclosure);
  const files={projection:{relativePath:"data/ram-current-retail.json",digestSha256:sha(projectionText)},productPage:{relativePath:catalogProduct.publicPath.slice(1)+"index.html",digestSha256:sha(productPageHtml)}};
  const base={authorization:{authorizationId,authorizationDigest:authorization.authorizationDigest},candidate:{candidateId:candidate.candidateId,candidateDigest:candidate.candidateDigest},lineage:{snapshotId:authorization.binding.snapshotId,snapshotDigest:authorization.binding.snapshotDigest,projectionDigest:authorization.binding.projectionDigest,publicFactsDigest:authorization.binding.publicFactsDigest},scope:{atlasProductId:authorization.binding.atlasProductId,publicationScope:authorization.binding.publicationScope,claimClass:authorization.binding.claimClass},publicFacts:authorization.binding.publicFacts,excludedClaims:authorization.binding.excludedClaims,disclosure:authorization.binding.publicFacts.disclosure,expiresAt:authorization.binding.expiresAt,files};
  const artifactDigest=currentDisplayPublicationDigest(base),artifact=freeze({schemaVersion:CURRENT_DISPLAY_ARTIFACT_SCHEMA_VERSION,artifactType:CURRENT_DISPLAY_ARTIFACT_TYPE,artifactId:`mer_displaypubart_${artifactDigest.slice(0,24)}`,artifactDigest,...base,builtAt,builtBy,status:"MATERIALIZED_VERIFIED",releaseAuthority:false,deploymentAuthority:false,content:{projectionText,productPageHtml}});
  if(!verifyCurrentDisplayPublicationArtifact({artifact,authorization,candidate,evaluatedAt:builtAt}))throw new Error("CURRENT_DISPLAY_ARTIFACT_VERIFICATION_FAILED");
  return this.artifactRepository.recordMaterialization({artifact,authorizationId,materializedAt:builtAt,materializedBy:builtBy});
 }
 async inspect(artifactId,{evaluatedAt=this.now()}={}){const artifact=await this.artifactRepository.getArtifact(artifactId);if(!artifact)throw new Error("CURRENT_DISPLAY_ARTIFACT_NOT_FOUND");const authorization=await this.publicationRepository.getAuthorization(artifact.authorization.authorizationId),candidate=await this.publicationRepository.getCandidate(artifact.candidate.candidateId);return freeze({artifact,valid:verifyCurrentDisplayPublicationArtifact({artifact,authorization,candidate,evaluatedAt}),live:false,consumption:await this.artifactRepository.getConsumption(artifact.authorization.authorizationId)});}
}
