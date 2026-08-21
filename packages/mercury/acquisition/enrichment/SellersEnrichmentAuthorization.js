import crypto from 'node:crypto';
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
function identity(p){return {productId:p?.providerIdentity?.productId??null,dataDocId:p?.providerIdentity?.dataDocId??null,gid:p?.providerIdentity?.gid??null}}
function binding(p){return {proposalId:p?.proposalId,atlasProductId:p?.atlasProductId,sourceProductsTaskId:p?.sourceProductsTaskId,sourceProductInfoTaskId:p?.sourceProductInfoTaskId,sourceProductInfoAuthorizationId:p?.sourceProductInfoAuthorizationId,operation:p?.operation,providerIdentity:identity(p)}}
export function createSellersEnrichmentAuthorizationRequest({proposal,createdAt=new Date().toISOString(),ttlMinutes=15,spentTodayUsd=0}={}){
 if(proposal?.status!=='PENDING_OPERATOR_REVIEW'||proposal?.operation!=='SELLERS') throw new Error('SELLERS_AUTHORIZATION_REQUIRES_REVIEWED_PROPOSAL');
 if(proposal.maxPaidTasks!==1||proposal.automaticPaidRetries!==0||Number(proposal.estimatedCostUsd)>0.001) throw new Error('SELLERS_PROPOSAL_EXCEEDS_GOVERNANCE');
 const providerIdentity=identity(proposal); if(!providerIdentity.productId&&!providerIdentity.dataDocId&&!providerIdentity.gid) throw new Error('SELLERS_PROVIDER_IDENTITY_REQUIRED');
 const proposalDigest=hash(binding(proposal)); const planId=`sellerplan_${hash([proposalDigest,createdAt]).slice(0,24)}`;
 const execution={kind:'SELLERS',...providerIdentity,locationName:'United States',languageName:'English'};
 const plan=freeze({schemaVersion:'1.0',planId,plannedAt:createdAt,policy:{schemaVersion:'1.0',enabled:true,maxPaidTasksPerRun:1,maxSpendPerRunUsd:.001,maxSpendPerDayUsd:.01,automaticPaidRetries:0},spentTodayUsd,approvedTaskCount:1,estimatedApprovedSpendUsd:.001,decisions:[{candidateId:`sellers:${proposal.atlasProductId}:${proposal.proposalId}`,priority:'NORMAL',estimatedCostUsd:.001,decision:'APPROVED',reason:null,rationale:'Operator-reviewed governed Product Info identity.',execution}]});
 const requestId=`sellerauth_${hash([planId,proposalDigest]).slice(0,24)}`;
 return freeze({schemaVersion:'1.0',requestId,mode:'LIVE',authorizationType:'SELLERS_ENRICHMENT',planId,proposalId:proposal.proposalId,proposalDigest,atlasProductId:proposal.atlasProductId,sourceProductsTaskId:proposal.sourceProductsTaskId,sourceProductInfoTaskId:proposal.sourceProductInfoTaskId,sourceProductInfoAuthorizationId:proposal.sourceProductInfoAuthorizationId,providerIdentity,createdAt,expiresAt:new Date(Date.parse(createdAt)+ttlMinutes*60000).toISOString(),maxSpendUsd:.001,maxPaidTasks:1,automaticPaidRetries:0,status:'PENDING_OPERATOR_APPROVAL',plan});
}
export function assertSellersAuthorizationBinding({request,proposal}={}){
 if(request?.authorizationType!=='SELLERS_ENRICHMENT'||request?.status!=='PENDING_OPERATOR_APPROVAL') throw new Error('SELLERS_AUTHORIZATION_REQUEST_NOT_PENDING');
 if(request.proposalId!==proposal?.proposalId||request.proposalDigest!==hash(binding(proposal))) throw new Error('SELLERS_PROPOSAL_BINDING_MISMATCH');
 const expected=identity(proposal),execution=request.plan?.decisions?.find(x=>x.decision==='APPROVED')?.execution;
 if(execution?.kind!=='SELLERS'||execution.dataDocId!==expected.dataDocId||execution.productId!==expected.productId||execution.gid!==expected.gid) throw new Error('SELLERS_EXECUTION_SUBSTITUTION_BLOCKED');
 return true;
}
