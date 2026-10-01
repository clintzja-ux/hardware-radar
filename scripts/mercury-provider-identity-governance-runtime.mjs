import path from "node:path";
import {createProductionPortfolioRuntime,parsePortfolioArgs} from "./mercury-acquisition-portfolio-runtime.mjs";
import {FileProviderIdentityGovernanceRepository} from "../packages/mercury/index.js";
export function createProviderIdentityGovernanceRuntime(){const args=parsePortfolioArgs(),portfolioRuntime=createProductionPortfolioRuntime(args),statePath=path.resolve(String(args.get("--governance-state")||".forge-review/mercury/provider-identity-governance.json"));return {args,...portfolioRuntime,governanceRepository:new FileProviderIdentityGovernanceRepository({statePath})};}
export function required(args,name){const value=args.get(name);if(typeof value!=="string"||!value.trim())throw new Error(`${name.slice(2).replaceAll("-","_").toUpperCase()}_REQUIRED`);return value.trim();}
export function selectedIdentity(args){return {dataDocId:args.get("--data-doc-id")||null,productId:args.get("--product-id")||null,gid:args.get("--gid")||null};}
