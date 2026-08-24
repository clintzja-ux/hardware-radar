import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {createHistoricalRefreshCadencePolicy} from "./HistoricalRefreshCadencePolicy.js";

const defaultReadJson=async resource=>JSON.parse(await readFile(resource instanceof URL?fileURLToPath(resource):resource,"utf8"));
export const INITIAL_PRODUCTION_HISTORICAL_REFRESH_CADENCE_POLICY_URL=new URL("./policies/initial-production-policy.json",import.meta.url);

export class HistoricalRefreshCadencePolicyRepository{
 constructor({policyUrl=INITIAL_PRODUCTION_HISTORICAL_REFRESH_CADENCE_POLICY_URL,readJson=defaultReadJson}={}){if(!(policyUrl instanceof URL)&&typeof policyUrl!=="string")throw new TypeError("HISTORICAL_REFRESH_CADENCE_POLICY_LOCATION_REQUIRED");if(typeof readJson!=="function")throw new TypeError("HISTORICAL_REFRESH_CADENCE_POLICY_READER_REQUIRED");this.policyUrl=policyUrl;this.readJson=readJson;}
 async getPolicy(){const raw=await this.readJson(this.policyUrl);if(raw?.schemaVersion!=="1.0"||raw?.policyType!=="HISTORICAL_REFRESH_CADENCE"||raw?.automaticExecution!==false)throw new Error("HISTORICAL_REFRESH_CADENCE_POLICY_STATE_INVALID");const policy=createHistoricalRefreshCadencePolicy(raw);if(JSON.stringify(policy)!==JSON.stringify(raw))throw new Error("HISTORICAL_REFRESH_CADENCE_POLICY_STATE_INVALID");return policy;}
}
export default HistoricalRefreshCadencePolicyRepository;
