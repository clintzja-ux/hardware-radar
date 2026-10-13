import assert from "node:assert/strict";
import {cp,mkdtemp,readFile,rm} from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {ProductionRamPortfolioRecompositionCommandService,ProductionRamPortfolioSentinelCommandService,ProductionRamPortfolioReleaseReadinessService} from "../index.js";

const root=await mkdtemp(path.join(os.tmpdir(),"newegg-publication-services-")),source=path.resolve(".forge-review/publication/ram-intelligence/mer_ramreleasecand_dca92bc0e5f7789a2efe4d18"),portfolioRoot=path.join(root,"publication"),candidateId=path.basename(source),target=path.join(portfolioRoot,candidateId);
try{
 await cp(source,target,{recursive:true});const manifest=JSON.parse(await readFile(path.join(target,"manifest.json"),"utf8")),context={input:{lineage:{sourceObservedAt:manifest.preparedAt},portfolioPreparedAt:manifest.preparedAt,certificationAt:manifest.preparedAt},priorResults:{}};
 const recomposition=new ProductionRamPortfolioRecompositionCommandService({root:path.resolve("."),stateRoot:root,portfolioRoot,runner:async()=>({status:"RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_PREPARED",candidateId:manifest.candidateId,artifactId:manifest.artifactId,bindingDigest:manifest.bindingDigest,releaseAuthority:false,deploymentAuthority:false})}),candidate=await recomposition.prepare({context});assert.equal(candidate.bindingDigest,manifest.bindingDigest);assert.equal(candidate.releaseAuthority,false);
 const sentinel=new ProductionRamPortfolioSentinelCommandService({root:path.resolve("."),certifiedBy:"fixture"}),certification=await sentinel.certify({candidate,context});assert.equal(certification.status,"CERTIFIED");assert.equal(certification.artifactBindingDigest,candidate.bindingDigest);
 context.priorResults.RECOMPOSITION={canonicalReceipt:{result:candidate}};const readiness=await new ProductionRamPortfolioReleaseReadinessService().assess({certification,context});assert.equal(readiness.state,"CERTIFIED_ZERO_AUTHORITY");assert.equal(readiness.releaseAuthority,false);assert.equal(readiness.deploymentAuthority,false);
 await assert.rejects(()=>sentinel.certify({candidate:{...candidate,bindingDigest:"0".repeat(64)},context}),/OUTPUT_INVALID/);
 console.log("Production Newegg routine portfolio/Sentinel services passed: 12 cases.");
}finally{await rm(root,{recursive:true,force:true});}
