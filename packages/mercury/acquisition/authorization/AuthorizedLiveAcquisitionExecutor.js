import { evaluateLiveAcquisitionAuthorization, LIVE_AUTHORIZATION_STATUSES } from './LiveAcquisitionAuthorization.js';
const freeze=(v)=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
export class AuthorizedLiveAcquisitionExecutor{
 constructor({executor,now=()=>new Date().toISOString()}={}){if(!executor?.execute)throw new TypeError('executor is required.');this.executor=executor;this.now=now;}
 async execute({plan,authorization}={}){
  const gate=evaluateLiveAcquisitionAuthorization({plan,authorization,now:this.now()});
  if(gate.status!==LIVE_AUTHORIZATION_STATUSES.LIVE_AUTHORIZED)return freeze({status:gate.status,authorized:false,gate});
  const execution=await this.executor.execute(plan);
  return freeze({status:execution.status,authorized:true,authorizationId:gate.authorizationId,gate,execution});
 }
}
export default AuthorizedLiveAcquisitionExecutor;
