import {readFile} from "node:fs/promises";
import {createCloudflareEmailServiceProviderConfiguration} from "./CloudflareEmailServiceProviderConfiguration.js";
const defaultUrl=new URL("./policies/cloudflare-email-service-provider.json",import.meta.url);
export class CloudflareEmailServiceProviderConfigurationRepository{constructor({configurationUrl=defaultUrl,readJson=async url=>JSON.parse(await readFile(url,"utf8"))}={}){if(typeof readJson!=="function")throw new TypeError("CLOUDFLARE_EMAIL_CONFIGURATION_REPOSITORY_INVALID");this.configurationUrl=configurationUrl;this.readJson=readJson;}async getConfiguration(){try{const raw=await this.readJson(this.configurationUrl),configuration=createCloudflareEmailServiceProviderConfiguration(raw);if(JSON.stringify(configuration)!==JSON.stringify(raw))throw new Error();return configuration;}catch{throw new Error("CLOUDFLARE_EMAIL_SERVICE_PROVIDER_STATE_INVALID");}}}
export default CloudflareEmailServiceProviderConfigurationRepository;
