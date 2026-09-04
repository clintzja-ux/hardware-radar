import crypto from 'node:crypto';

const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');

export function createProductInfoEnrichmentAuthorizationRequest({proposal,createdAt=new Date().toISOString(),ttlMinutes=15,spentTodayUsd=0}={}){
  if(proposal?.status!=='PENDING_OPERATOR_REVIEW'||proposal?.operation!=='PRODUCT_INFO') throw new Error('PRODUCT_INFO_AUTHORIZATION_REQUIRES_REVIEWED_PROPOSAL');
  if(proposal.maxPaidTasks!==1||proposal.automaticPaidRetries!==0||Number(proposal.estimatedCostUsd)>0.001) throw new Error('PRODUCT_INFO_PROPOSAL_EXCEEDS_GOVERNANCE');
  const providerIdentity={productId:proposal.providerIdentity?.productId??null,dataDocId:proposal.providerIdentity?.dataDocId??null,gid:proposal.providerIdentity?.gid??null};
  if(!providerIdentity.productId&&!providerIdentity.dataDocId&&!providerIdentity.gid) throw new Error('PRODUCT_INFO_PROVIDER_IDENTITY_REQUIRED');
  if(!Number.isFinite(spentTodayUsd)||spentTodayUsd<0) throw new Error('PRODUCT_INFO_CURRENT_DAY_SPEND_INVALID');
  if(Math.round((spentTodayUsd+.001+Number.EPSILON)*1e9)/1e9>.01) throw new Error('PRODUCT_INFO_DAILY_BUDGET_EXCEEDED');
  const binding={proposalId:proposal.proposalId,sourceTaskId:proposal.sourceTaskId,atlasProductId:proposal.atlasProductId,operation:'PRODUCT_INFO',providerIdentity};
  if(proposal.providerSelectionLineage) binding.providerSelectionLineage=proposal.providerSelectionLineage;
  if(proposal.governanceBinding) binding.governanceBinding=proposal.governanceBinding;
  const proposalDigest=hash(binding);
  const planId=`enrichplan_${hash([proposalDigest,createdAt]).slice(0,24)}`;
  const execution={kind:'PRODUCT_INFO',...providerIdentity,locationName:proposal.governanceBinding?.providerRequest?.locationName??'United States',languageName:proposal.governanceBinding?.providerRequest?.languageName??'English'};
  const plan=freeze({schemaVersion:'1.0',planId,plannedAt:createdAt,policy:{schemaVersion:'1.0',enabled:true,maxPaidTasksPerRun:1,maxSpendPerRunUsd:0.001,maxSpendPerDayUsd:0.01,automaticPaidRetries:0},spentTodayUsd,approvedTaskCount:1,estimatedApprovedSpendUsd:0.001,decisions:[{candidateId:`enrichment:${proposal.atlasProductId}:${proposal.proposalId}`,priority:'NORMAL',estimatedCostUsd:0.001,decision:'APPROVED',reason:null,rationale:'Operator-reviewed E2C product identity recommendation.',execution}]});
  const requestId=`enrichauth_${hash([planId,proposalDigest]).slice(0,24)}`;
  const request={schemaVersion:'1.0',requestId,mode:'LIVE',authorizationType:'PRODUCT_INFO_ENRICHMENT',planId,proposalId:proposal.proposalId,proposalDigest,sourceTaskId:proposal.sourceTaskId,atlasProductId:proposal.atlasProductId,providerIdentity,createdAt,expiresAt:new Date(Date.parse(createdAt)+ttlMinutes*60000).toISOString(),maxSpendUsd:0.001,maxPaidTasks:1,automaticPaidRetries:0,status:'PENDING_OPERATOR_APPROVAL',plan};if(proposal.providerSelectionLineage)request.providerSelectionLineage=proposal.providerSelectionLineage;if(proposal.governanceBinding)request.governanceBinding=proposal.governanceBinding;return freeze(request);
}

export function assertProductInfoAuthorizationBinding({request,proposal}={}){
  if(request?.authorizationType!=='PRODUCT_INFO_ENRICHMENT'||request?.status!=='PENDING_OPERATOR_APPROVAL') throw new Error('PRODUCT_INFO_AUTHORIZATION_REQUEST_NOT_PENDING');
  const providerIdentity={productId:proposal?.providerIdentity?.productId??null,dataDocId:proposal?.providerIdentity?.dataDocId??null,gid:proposal?.providerIdentity?.gid??null};
  const binding={proposalId:proposal?.proposalId,sourceTaskId:proposal?.sourceTaskId,atlasProductId:proposal?.atlasProductId,operation:proposal?.operation,providerIdentity};if(proposal?.providerSelectionLineage)binding.providerSelectionLineage=proposal.providerSelectionLineage;if(proposal?.governanceBinding)binding.governanceBinding=proposal.governanceBinding;const digest=hash(binding);
  if(request.proposalId!==proposal?.proposalId||request.proposalDigest!==digest) throw new Error('PRODUCT_INFO_PROPOSAL_BINDING_MISMATCH');
  if(JSON.stringify(request.providerSelectionLineage??null)!==JSON.stringify(proposal?.providerSelectionLineage??null)) throw new Error('PRODUCT_INFO_PROVIDER_SELECTION_LINEAGE_MISMATCH');
  if(JSON.stringify(request.governanceBinding??null)!==JSON.stringify(proposal?.governanceBinding??null)) throw new Error('PRODUCT_INFO_GOVERNANCE_BINDING_MISMATCH');
  const execution=request.plan?.decisions?.find(x=>x.decision==='APPROVED')?.execution;
  if(execution?.kind!=='PRODUCT_INFO'||execution.dataDocId!==providerIdentity.dataDocId||execution.productId!==providerIdentity.productId||execution.gid!==providerIdentity.gid) throw new Error('PRODUCT_INFO_EXECUTION_SUBSTITUTION_BLOCKED');
  return true;
}
