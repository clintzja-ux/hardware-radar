import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { CertifiedCandidateReleasePromotionOwner } from "./CertifiedCandidateReleasePromotion.js";
import { FileLivePricePublicationAuthorizationRepository, GovernedLivePricePublicationCoordinator } from "./GovernedLivePricePublication.js";
import { CloudflarePagesDeploymentObserver, GitHubAppReleaseGitOwner, PublicArtifactIntegrityVerifier } from "./ProductionUnattendedPublicationBindings.js";
import { UnattendedLivePricePublicationCoordinator } from "./UnattendedLivePricePublication.js";
import { createPortableNpmRunner } from "../../../scripts/lib/portable-npm-runner.mjs";
import { createGitHubAppInstallationTokenProviderFromEnvironment } from "./GitHubAppInstallationAuthentication.js";
import { fileURLToPath } from "node:url";

export function createProductionUnattendedPublicationCoordinator({root,repository,candidateOwner}={}) {
  const exec=promisify(execFile), run=(command,args,cwd=root,options={})=>exec(command,args,{cwd,windowsHide:true,maxBuffer:32*1024*1024,...options}), runNpm=createPortableNpmRunner({execFile:exec,cwd:root,baseOptions:{windowsHide:true,maxBuffer:32*1024*1024}});
  const authorizations=new FileLivePricePublicationAuthorizationRepository({statePath:path.join(root,".forge-review/publication/live-price-authorizations.json")});
  const governed=new GovernedLivePricePublicationCoordinator({authorizationRepository:authorizations,gitInspector:{inspect:async()=>{const {stdout}=await run("git",["status","--porcelain=v1","--untracked-files=all"]);const changedPaths=stdout.split(/\r?\n/).filter(Boolean).map(line=>line.slice(3).replace(/^"|"$/g,""));return{clean:changedPaths.length===0,changedPaths};}},buildRunner:{run:({generatedAt,environment})=>runNpm("build:public",{env:{...process.env,HARDWARE_RADAR_PUBLIC_RELEASE_ENVIRONMENT:environment,HARDWARE_RADAR_GENERATED_AT:generatedAt}})},verificationRunner:{run:async({authorization})=>{const env={...process.env,HARDWARE_RADAR_PUBLIC_RELEASE_ENVIRONMENT:authorization.targetEnvironment};for(const script of ["verify:public","test:ram-products","test:ram-catalog","test:ram-terminal","test:retailer-destinations","test:release-governance","test:layout"])await runNpm(script,{env});}}});
  const preparationOwner={prepare:({candidate,child,originalCleanCheckout})=>new CertifiedCandidateReleasePromotionOwner({recurringAuthorityRepository:repository,publicationAuthorizationRepository:authorizations,preparationOwner:governed}).prepare({candidate,child,originalCleanCheckout,checkoutRoot:root,candidateDirectory:path.join(candidateOwner.artifactRoot,candidate.candidateId)})};
  const askPassFile=process.platform==="win32"?"../../../scripts/lib/github-app-git-askpass.cmd":"../../../scripts/lib/github-app-git-askpass.mjs";
  const gitOwner=new GitHubAppReleaseGitOwner({runner:run,checkoutRoot:root,tokenProvider:createGitHubAppInstallationTokenProviderFromEnvironment(),askPassPath:fileURLToPath(new URL(askPassFile,import.meta.url))}), deploymentOwner=new CloudflarePagesDeploymentObserver({accountId:process.env.CLOUDFLARE_ACCOUNT_ID,projectName:process.env.CLOUDFLARE_PAGES_PROJECT_NAME,tokenProvider:async()=>process.env.CLOUDFLARE_API_TOKEN}), liveVerifier=new PublicArtifactIntegrityVerifier();
  return new UnattendedLivePricePublicationCoordinator({repository,candidateOwner,preparationOwner,gitOwner,deploymentOwner,liveVerifier});
}
