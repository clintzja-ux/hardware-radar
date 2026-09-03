import {readFile} from "node:fs/promises";
import {createCloudflareWorkersLogsMonitoringDestination} from "./CloudflareWorkersLogsMonitoringDestination.js";
const defaultDestinationUrl=new URL("./policies/cloudflare-workers-logs-monitoring-destination.json",import.meta.url);
export class CloudflareWorkersLogsMonitoringDestinationRepository{constructor({destinationUrl=defaultDestinationUrl,readJson=async url=>JSON.parse(await readFile(url,"utf8"))}={}){if(typeof readJson!=="function")throw new TypeError("MONITORING_DESTINATION_REPOSITORY_INVALID");this.destinationUrl=destinationUrl;this.readJson=readJson;}async getDestination(){try{const raw=await this.readJson(this.destinationUrl),destination=createCloudflareWorkersLogsMonitoringDestination(raw);if(JSON.stringify(destination)!==JSON.stringify(raw))throw new Error();return destination;}catch{throw new Error("MONITORING_DESTINATION_STATE_INVALID");}}}
export default CloudflareWorkersLogsMonitoringDestinationRepository;
