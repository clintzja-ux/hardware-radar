import {createGatewayOperationalMonitoringRecord} from "./GatewayOperationalMonitoringRecord.js";
const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
export class GatewayOperationalMonitoringSink{constructor({writer}={}){if(!writer?.record)throw new TypeError("GATEWAY_OPERATIONAL_MONITORING_WRITER_REQUIRED");this.writer=writer;}async record(event){const validated=createGatewayOperationalMonitoringRecord(event);try{await this.writer.record(structuredClone(validated));return freeze({status:"RECORDED"});}catch{return freeze({status:"MONITORING_DEGRADED",errorClassification:"MONITORING_SINK_FAILURE"});}}}
export default GatewayOperationalMonitoringSink;
