import crypto from "node:crypto";
import {readFile} from "node:fs/promises";

const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const digest=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");

export class ProductionForgeNeweggRoutineProvider{
 constructor({statePath}={}){this.statePath=statePath;}
 async load(){if(!this.statePath)return null;try{const state=JSON.parse(await readFile(this.statePath,"utf8")),value=state?.schemaVersion==="1.0"&&state?.projection?state.projection:state;if(state?.projection&&(state.projectionDigest!==digest(value)))throw new Error("FORGE_NEWEGG_ROUTINE_STATE_INVALID");if(value?.projectionType!=="NEWEGG_ROUTINE_OPERATIONS"||value.readOnly!==true||value.mutationAuthorized!==false||value.networkOperation!=="NONE")throw new Error("FORGE_NEWEGG_ROUTINE_STATE_INVALID");return structuredClone(value);}catch(error){if(error?.code==="ENOENT")return null;throw error;}}
}

export default ProductionForgeNeweggRoutineProvider;
