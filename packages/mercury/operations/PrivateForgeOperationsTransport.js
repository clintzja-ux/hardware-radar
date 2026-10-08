import crypto from "node:crypto";

export const PRIVATE_FORGE_TRANSPORT_VERSION="PRIVATE-FORGE-OPERATIONS-TRANSPORT-P1-1.0";
const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const hash=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const timingSafe=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y);};

export function createPrivateForgeOperationsEnvelope({projection,createdAt,maximumAgeSeconds=900}={}){
 if(projection?.projectionType!=="NEWEGG_ROUTINE_OPERATIONS"||projection.readOnly!==true||projection.mutationAuthorized!==false||projection.networkOperation!=="NONE"||!Number.isFinite(Date.parse(createdAt)))throw new TypeError("PRIVATE_FORGE_PROJECTION_INVALID");
 const projectionDigest=hash(projection);return Object.freeze({schemaVersion:"1.0",transportVersion:PRIVATE_FORGE_TRANSPORT_VERSION,transportType:"PRIVATE_FORGE_OPERATIONS",audience:"HARDWARE_RADAR_INTERNAL_FORGE",createdAt:new Date(createdAt).toISOString(),expiresAt:new Date(Date.parse(createdAt)+maximumAgeSeconds*1000).toISOString(),projectionDigest,projection:structuredClone(projection),readOnly:true,mutationAuthorized:false,networkOperation:"NONE",releaseAuthority:false,envelopeDigest:hash({projectionDigest,createdAt:new Date(createdAt).toISOString(),maximumAgeSeconds,audience:"HARDWARE_RADAR_INTERNAL_FORGE"})});
}

export class PrivateForgeOperationsTransport{
 constructor({store,accessToken,now=()=>new Date().toISOString()}={}){if(!store?.put||!store?.get||typeof accessToken!=="string"||accessToken.length<24)throw new TypeError("PRIVATE_FORGE_TRANSPORT_CONFIGURATION_INVALID");this.store=store;this.accessToken=accessToken;this.now=now;}
 async publish(envelope){this.validate(envelope,{allowStale:false});await this.store.put(envelope.projectionDigest,structuredClone(envelope));return Object.freeze({status:"DELIVERED",projectionDigest:envelope.projectionDigest,envelopeDigest:envelope.envelopeDigest,providerCalls:0,actualSpendUsd:0});}
 async readLatest({accessToken}={}){if(!timingSafe(accessToken??"",this.accessToken))throw Object.assign(new Error("PRIVATE_FORGE_ACCESS_DENIED"),{code:"PRIVATE_FORGE_ACCESS_DENIED"});const envelope=await this.store.get();this.validate(envelope,{allowStale:false});return structuredClone(envelope);}
 validate(envelope,{allowStale=false}={}){if(!envelope||envelope.transportVersion!==PRIVATE_FORGE_TRANSPORT_VERSION||envelope.readOnly!==true||envelope.mutationAuthorized!==false||envelope.networkOperation!=="NONE"||envelope.projectionDigest!==hash(envelope.projection)||envelope.envelopeDigest!==hash({projectionDigest:envelope.projectionDigest,createdAt:envelope.createdAt,maximumAgeSeconds:(Date.parse(envelope.expiresAt)-Date.parse(envelope.createdAt))/1000,audience:envelope.audience}))throw new Error("PRIVATE_FORGE_PROJECTION_CORRUPT");if(!allowStale&&Date.parse(envelope.expiresAt)<=Date.parse(this.now()))throw new Error("PRIVATE_FORGE_PROJECTION_STALE");return true;}
}

export class InMemoryPrivateForgeOperationsStore{constructor(){this.value=null;}async put(_identity,value){this.value=structuredClone(value);}async get(){return structuredClone(this.value);}}

export function createPrivateForgeOperationsHttpHandler({transport}={}){
 if(!transport?.readLatest)throw new TypeError("PRIVATE_FORGE_HTTP_TRANSPORT_REQUIRED");
 return async function handle(request,response){
  response.setHeader("Cache-Control","private, no-store");response.setHeader("X-Robots-Tag","noindex, nofollow");response.setHeader("Content-Type","application/json; charset=utf-8");
  if(request.method!=="GET"||request.url!=="/internal/forge/newegg-routine"){response.statusCode=404;response.end(JSON.stringify({error:"NOT_FOUND"}));return;}
  const header=String(request.headers?.authorization??""),token=header.startsWith("Bearer ")?header.slice(7):"";
  try{const envelope=await transport.readLatest({accessToken:token});response.statusCode=200;response.end(JSON.stringify(envelope));}catch(error){response.statusCode=error?.code==="PRIVATE_FORGE_ACCESS_DENIED"?401:503;response.end(JSON.stringify({error:error?.code??error?.message??"PRIVATE_FORGE_TRANSPORT_FAILURE"}));}
 };
}
