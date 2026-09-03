import fs from 'node:fs/promises';
import path from 'node:path';
import { ProductRepository } from '../packages/atlas/index.js';
import { DataForSeoMerchantApiClient, DataForSeoAcquisitionService, loadDataForSeoCredentials, prepareProductEnrichmentFromProductsResult } from '../packages/mercury/index.js';
import { createProductsDiscoveryCheckpoint, ProductsCheckpointReviewService } from '../packages/mercury/index.js';
import { createProductionPortfolioRuntime, parsePortfolioArgs } from './mercury-acquisition-portfolio-runtime.mjs';

const sourceTaskId=process.argv.find(x=>x.startsWith('--source-task-id='))?.split('=')[1];
const atlasProductId=process.argv.find(x=>x.startsWith('--atlas-product-id='))?.split('=')[1];
const portfolioCycleId=process.argv.find(x=>x.startsWith('--portfolio-cycle-id='))?.split('=')[1]??null;
if(!sourceTaskId) throw new Error('SOURCE_TASK_ID_REQUIRED');
if(!atlasProductId) throw new Error('ATLAS_PRODUCT_ID_REQUIRED');
const credentials=loadDataForSeoCredentials();
const transport=async({method,url,headers,body})=>{const r=await fetch(url,{method,headers,body:body?JSON.stringify(body):undefined});const d=await r.json();if(!r.ok)throw new Error(`HTTP ${r.status}`);return d;};
const client=new DataForSeoMerchantApiClient({login:credentials.login,password:credentials.password,transport});
const acquisition=new DataForSeoAcquisitionService({client});
const readLocalJson=async(resource)=>JSON.parse(await fs.readFile(resource,'utf8'));
const atlasProduct=await new ProductRepository({readJson:readLocalJson}).loadProduct(atlasProductId);
const productsResult=await acquisition.getProductsResult(sourceTaskId);
const prepared=await prepareProductEnrichmentFromProductsResult({atlasProduct,sourceTaskId,productsResult});
let durableReview=null;
if(portfolioCycleId){
  const runtime=createProductionPortfolioRuntime(parsePortfolioArgs()),portfolio=await runtime.portfolioRepository.getById(portfolioCycleId);
  if(!portfolio)throw new Error('PORTFOLIO_NOT_FOUND');
  const checkpoint=createProductsDiscoveryCheckpoint({portfolio,asOf:portfolio.asOf}),task=await runtime.checkpointRepository.getTask(portfolioCycleId,checkpoint.checkpointId,atlasProductId),events=await runtime.checkpointRepository.events(portfolioCycleId,checkpoint.checkpointId);
  if(!task||!events.some(x=>x.type==='PRODUCTS_POSTED'&&x.atlasProductId===atlasProductId&&x.providerTaskId===sourceTaskId))throw new Error('PRODUCTS_RESULT_CHECKPOINT_TASK_BINDING_INVALID');
  const resolution=prepared.resolution,state=resolution.recommendationStatus==='RECOMMENDED'?'EXACT_OR_GOVERNED_MATCH':resolution.candidateCount===0?'NO_RESULT':resolution.candidates.some(x=>x.contradictions?.length)?'CONTRADICTED':'AMBIGUOUS_REVIEW_REQUIRED';
  durableReview=await new ProductsCheckpointReviewService({repository:runtime.checkpointRepository}).record({task,result:productsResult,assessment:{providerTaskId:sourceTaskId,identityState:state,resultIdentity:resolution,reasons:resolution.candidates.flatMap(x=>x.contradictions??[])}});
}
const out=path.resolve('.forge-review/acquisition/product-enrichment-proposal.json');
await fs.mkdir(path.dirname(out),{recursive:true});
await fs.writeFile(out,JSON.stringify(prepared,null,2)+'\n');
const r=prepared.resolution, p=prepared.proposal;
console.log('PRODUCT ENRICHMENT PREPARE');
console.log('Source task:          ',sourceTaskId);
console.log('Target Atlas SKU:     ',atlasProductId);
console.log('Candidates:           ',r.candidateCount);
console.log('Resolution:           ',r.recommendationStatus);
console.log('Selected docid:       ',p?.providerIdentity?.dataDocId??null);
if(r.recommendedCandidate){
  console.log('Selected score:       ',r.recommendedCandidate.score);
  console.log('Identity evidence:');
  for(const s of r.recommendedCandidate.signals) console.log(`  ${s.name.padEnd(22)} ${s.matched?'MATCH':'NO_MATCH'}${s.detail!==null&&s.detail!==undefined?` (${s.detail})`:''}`);
  console.log('Contradictions:       ',r.recommendedCandidate.contradictions.length?r.recommendedCandidate.contradictions.join(', '):'NONE');
}
if(r.runnerUp){
  console.log('Runner-up docid:      ',r.runnerUp.item.dataDocId??null);
  console.log('Runner-up score:      ',r.runnerUp.score);
  console.log('Score margin:         ',r.recommendedCandidate?r.recommendedCandidate.score-r.runnerUp.score:null);
}
console.log('Operation:            ',p?.operation??null);
console.log('Paid task created:     NO');
console.log('Actual spend:          $0.000');
console.log('Status:                ',p?.status??'NO_PROPOSAL');
console.log('Proposal export:       .forge-review\\acquisition\\product-enrichment-proposal.json');
if(durableReview) console.log('Durable review:        ',durableReview.review.reviewId);
