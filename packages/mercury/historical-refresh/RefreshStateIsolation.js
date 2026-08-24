import path from "node:path";

export const PRODUCTION_REFRESH_PLAN_PATH=path.resolve(".forge-review/acquisition/historical-refresh-plan.json");
export const PRODUCTION_REFRESH_AUTHORIZATION_PATH=path.resolve(".forge-review/acquisition/historical-refresh-authorization-request.json");

export function assertRefreshStateIsolation({testMode=false,requiredArguments=[],args,writePaths=[],accessPaths=[]}={}){
 if(!testMode)return true;
 for(const name of requiredArguments)if(!args?.has(name))throw new Error(`TEST_REFRESH_STATE_PATH_REQUIRED:${name}`);
 for(const value of writePaths){const resolved=path.resolve(String(value));if(resolved===PRODUCTION_REFRESH_PLAN_PATH||resolved===PRODUCTION_REFRESH_AUTHORIZATION_PATH)throw new Error("TEST_PRODUCTION_REFRESH_STATE_WRITE_BLOCKED");}
 const productionRoot=`${path.resolve(".forge-review")}${path.sep}`;for(const value of accessPaths){const resolved=path.resolve(String(value));if(resolved.startsWith(productionRoot))throw new Error("TEST_PRODUCTION_REFRESH_STATE_ACCESS_BLOCKED");}
 return true;
}
