import {createHash} from "node:crypto";
const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const fingerprint=event=>createHash("sha256").update(JSON.stringify({schemaVersion:event.schemaVersion,eventId:event.eventId,atlasProductId:event.atlasProductId,signalType:event.signalType,sourceSurface:event.sourceSurface,occurredAt:event.occurredAt,retailerId:event.retailerId})).digest("hex");
export const firstPartyInterestEventFingerprint=fingerprint;
export const createFirstPartyInterestSignalId=eventId=>`beacon_interest_${createHash("sha256").update(eventId).digest("hex").slice(0,24)}`;
export class FirstPartyProductInterestCollectionRepository{
 constructor(){this.records=new Map();}
 accept({event,signal}={}){if(!event||!signal||event.eventId!==signal.provenance?.eventId)throw new TypeError("FIRST_PARTY_INTEREST_COLLECTION_RECORD_INVALID");const hash=fingerprint(event),existing=this.records.get(event.eventId);if(existing){if(existing.materialFingerprint!==hash)throw new Error("FIRST_PARTY_INTEREST_EVENT_CONFLICT");return freeze({status:"DUPLICATE",signal:existing.signal});}const record=freeze({event:structuredClone(event),materialFingerprint:hash,signal:structuredClone(signal)});this.records.set(event.eventId,record);return freeze({status:"ACCEPTED",signal:record.signal});}
 getSignals(){return freeze([...this.records.values()].map(x=>x.signal).sort((a,b)=>a.signalId.localeCompare(b.signalId)));}
 getRecords(){return freeze([...this.records.values()].map(x=>x).sort((a,b)=>a.event.eventId.localeCompare(b.event.eventId)));}
}
export default FirstPartyProductInterestCollectionRepository;
