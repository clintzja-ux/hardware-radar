import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { CertifiedCandidateReleasePromotionOwner } from "./CertifiedCandidateReleasePromotion.js";
import { FileLivePricePublicationAuthorizationRepository, GovernedLivePricePublicationCoordinator } from "./GovernedLivePricePublication.js";
import { CloudflarePagesDeploymentObserver, GitHubAppReleaseGitOwner, PublicArtifactIntegrityVerifier } from "./ProductionUnattendedPublicationBindings.js";
import { BoundedPrePushPublicationRecoveryCoordinator, UnattendedLivePricePublicationCoordinator } from "./UnattendedLivePricePublication.js";
import { createPortableNpmRunner } from "../../../scripts/lib/portable-npm-runner.mjs";
import { createGitHubAppInstallationTokenProviderFromEnvironment } from "./GitHubAppInstallationAuthentication.js";
import { fileURLToPath } from "node:url";
import { PublicationAuthorizationStateMigration } from "./PublicationAuthorizationStateMigration.js";

export async function createProductionUnattendedPublicationCoordinator({runtimeRoot,evidenceRoot,workspaceRoot,publicOutputRoot,repository,candidateOwner,recovery=false}={}) {
  const roots={runtimeRoot,evidenceRoot,workspaceRoot,publicOutputRoot};
  for(const [name,value] of Object.entries(roots))if(typeof value!=="string"||!path.isAbsolute(value))throw new Error(`PUBLICATION_${name.replace(/[A-Z]/g,letter=>`_${letter}`).toUpperCase()}_INVALID`);
  if(path.resolve(publicOutputRoot)!==path.join(path.resolve(workspaceRoot),"public"))throw new Error("PUBLICATION_PUBLIC_OUTPUT_ROOT_CONFLICT");
  const runtime=path.resolve(runtimeRoot),evidence=path.resolve(evidenceRoot),workspace=path.resolve(workspaceRoot),output=path.resolve(publicOutputRoot);
  const exec=promisify(execFile), run=(command,args,cwd=workspace,options={})=>exec(command,args,{cwd,windowsHide:true,maxBuffer:32*1024*1024,...options}), runNpm=createPortableNpmRunner({execFile:exec,cwd:runtime,baseOptions:{windowsHide:true,maxBuffer:32*1024*1024}});
  const authorizationStatePath=path.join(evidence,".forge-review/publication/live-price-authorizations.json"),migration=new PublicationAuthorizationStateMigration({legacyStatePath:path.join(workspace,".forge-review/publication/live-price-authorizations.json"),canonicalStatePath:authorizationStatePath,auditPath:path.join(evidence,".forge-review/publication/live-price-authorizations.migration.json")}),migrationInspection=await migration.inspect();
  if(["MIGRATION_READY","MIGRATION_CONFLICT","RECONCILIATION_INTERRUPTED"].includes(migrationInspection.status))throw new Error(`PUBLICATION_AUTHORIZATION_MIGRATION_REQUIRED:${migrationInspection.status}`);
  const authorizations=new FileLivePricePublicationAuthorizationRepository({statePath:authorizationStatePath});
  const publicationEnvironment={HARDWARE_RADAR_PUBLICATION_WORKSPACE_ROOT:workspace,HARDWARE_RADAR_PUBLIC_OUTPUT_ROOT:output,HARDWARE_RADAR_STATIC_RELEASE_MANIFEST:path.join(workspace,"config","publication-release.json")};
  const governed=new GovernedLivePricePublicationCoordinator({authorizationRepository:authorizations,gitInspector:{inspect:async()=>{const {stdout}=await run("git",["status","--porcelain=v1","--untracked-files=all"]);const changedPaths=stdout.split(/\r?\n/).filter(Boolean).map(line=>line.slice(3).replace(/^"|"$/g,""));return{clean:changedPaths.length===0,changedPaths};}},buildRunner:{run:({generatedAt,environment})=>runNpm("build:public:price-publication",{env:{...process.env,...publicationEnvironment,HARDWARE_RADAR_PUBLIC_RELEASE_ENVIRONMENT:environment,HARDWARE_RADAR_GENERATED_AT:generatedAt}})},verificationRunner:{run:async({authorization})=>{const env={...process.env,...publicationEnvironment,HARDWARE_RADAR_PUBLIC_RELEASE_ENVIRONMENT:authorization.targetEnvironment};for(const script of ["verify:public:price-publication","test:ram-products","test:ram-catalog","test:ram-terminal","test:retailer-destinations","test:release-governance","test:layout"])await runNpm(script,{env});}}});
  const preparationOwner={prepare:({candidate,child,originalCleanCheckout})=>new CertifiedCandidateReleasePromotionOwner({recurringAuthorityRepository:repository,publicationAuthorizationRepository:authorizations,preparationOwner:governed}).prepare({candidate,child,originalCleanCheckout,checkoutRoot:workspace,candidateDirectory:path.join(candidateOwner.artifactRoot,candidate.candidateId)})};
  const askPassFile=process.platform==="win32"?"../../../scripts/lib/github-app-git-askpass.cmd":"../../../scripts/lib/github-app-git-askpass.mjs";
  const gitOwner=new GitHubAppReleaseGitOwner({runner:run,checkoutRoot:workspace,tokenProvider:createGitHubAppInstallationTokenProviderFromEnvironment(),askPassPath:fileURLToPath(new URL(askPassFile,import.meta.url))}), deploymentOwner=new CloudflarePagesDeploymentObserver({accountId:process.env.CLOUDFLARE_ACCOUNT_ID,projectName:process.env.CLOUDFLARE_PAGES_PROJECT_NAME,tokenProvider:async()=>process.env.CLOUDFLARE_API_TOKEN}), liveVerifier=new PublicArtifactIntegrityVerifier();
  if(recovery)return new BoundedPrePushPublicationRecoveryCoordinator({repository,candidateOwner,gitOwner,deploymentOwner,liveVerifier,authorizationRepository:authorizations});
  return new UnattendedLivePricePublicationCoordinator({repository,candidateOwner,preparationOwner,gitOwner,deploymentOwner,liveVerifier,authorizationRepository:authorizations});
}
