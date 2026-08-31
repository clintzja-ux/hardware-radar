import {historicalRefreshPlanDigest} from "./HistoricalRefreshAuthorization.js";

export async function validateHistoricalRefreshPlanAgainstCurrentState({refreshPlan,prepareService,sellersAuthorization,executionRuns=[],priorRefreshPlan=null,priorRefreshAuthorization=null,priorRefreshResult=null}={}){
 if(!prepareService?.prepare)throw new TypeError("prepareService is required.");
 const current=await prepareService.prepare({atlasProductId:refreshPlan?.atlasProductId,sellersAuthorization,executionRuns,refreshPlan:priorRefreshPlan,refreshAuthorization:priorRefreshAuthorization,refreshResult:priorRefreshResult});
 if(current.refreshPlanId!==refreshPlan?.refreshPlanId||historicalRefreshPlanDigest(current)!==historicalRefreshPlanDigest(refreshPlan))throw new Error("HISTORICAL_REFRESH_PLAN_CURRENT_STATE_MISMATCH");
 return Object.freeze({valid:true,refreshPlanId:current.refreshPlanId,refreshPlanDigest:historicalRefreshPlanDigest(current)});
}
