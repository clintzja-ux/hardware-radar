import crypto from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
export class FileLiveAuthorizationConsumptionRepository{
 constructor({filePath}={}){if(!filePath)throw new TypeError('filePath is required.');this.filePath=resolve(filePath)}
 async _read(){try{const x=JSON.parse(await readFile(this.filePath,'utf8'));if(x?.schemaVersion!=='1.0'||!Array.isArray(x.consumed))throw new Error('INVALID_LIVE_AUTHORIZATION_CONSUMPTION_STATE');return x}catch(e){if(e?.code==='ENOENT')return {schemaVersion:'1.0',consumed:[]};throw e}}
 async isConsumed(authorizationId){return (await this._read()).consumed.some(x=>x.authorizationId===authorizationId)}
 async getAll(){return Object.freeze(structuredClone((await this._read()).consumed))}
 async consume({authorizationId,planId,consumedAt}){const s=await this._read();if(s.consumed.some(x=>x.authorizationId===authorizationId))return {status:'ALREADY_CONSUMED'};const next={...s,consumed:[...s.consumed,{authorizationId,planId,consumedAt}]};await mkdir(dirname(this.filePath),{recursive:true});const t=`${this.filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;await writeFile(t,`${JSON.stringify(next,null,2)}\n`,'utf8');await rename(t,this.filePath);return {status:'CONSUMED'}}
}
