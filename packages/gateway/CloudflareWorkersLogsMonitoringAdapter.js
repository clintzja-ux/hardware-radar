import {createGatewayOperationalMonitoringRecord} from "./GatewayOperationalMonitoringRecord.js";
const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
export class CloudflareWorkersLogsMonitoringAdapter{constructor({logger}={}){if(typeof logger?.log!=="function")throw new TypeError("CLOUDFLARE_WORKERS_LOGGER_REQUIRED");this.logger=logger;}async record(input){const record=createGatewayOperationalMonitoringRecord(input),structured=freeze({schemaVersion:"1.0",logType:"HARDWARE_RADAR_GATEWAY_OPERATIONAL",...structuredClone(record)});await this.logger.log(structured);return freeze({status:"EMITTED"});}}
export default CloudflareWorkersLogsMonitoringAdapter;
