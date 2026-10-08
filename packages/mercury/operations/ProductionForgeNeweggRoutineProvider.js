import {readFile} from "node:fs/promises";

export class ProductionForgeNeweggRoutineProvider{
 constructor({statePath}={}){this.statePath=statePath;}
 async load(){if(!this.statePath)return null;try{const value=JSON.parse(await readFile(this.statePath,"utf8"));if(value?.projectionType!=="NEWEGG_ROUTINE_OPERATIONS"||value.readOnly!==true||value.mutationAuthorized!==false||value.networkOperation!=="NONE")throw new Error("FORGE_NEWEGG_ROUTINE_STATE_INVALID");return structuredClone(value);}catch(error){if(error?.code==="ENOENT")return null;throw error;}}
}

export default ProductionForgeNeweggRoutineProvider;
