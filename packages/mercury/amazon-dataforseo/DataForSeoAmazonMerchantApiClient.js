import { DATAFORSEO_API_BASE_URL, DATAFORSEO_NORMAL_PRIORITY } from "../acquisition/dataforseo/DataForSeoConfig.js";

const required=(value,name)=>{if(typeof value!=="string"||!value.trim())throw new TypeError(`${name} is required.`);return value.trim();};
const basic=(login,password)=>`Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`;
function firstTask(response){if(response?.status_code!==20000||!Array.isArray(response.tasks)||!response.tasks[0])throw new Error(`DATAFORSEO_API_ERROR:${response?.status_code??"UNKNOWN"}`);const task=response.tasks[0];if(task.status_code>=40000)throw new Error(`DATAFORSEO_TASK_ERROR:${task.status_code}`);return task;}

export class DataForSeoAmazonMerchantApiClient{
 constructor({login,password,transport,baseUrl=DATAFORSEO_API_BASE_URL}={}){this.login=required(login,"login");this.password=required(password,"password");if(typeof transport!=="function")throw new TypeError("transport is required.");this.transport=transport;this.baseUrl=baseUrl.replace(/\/$/,"");}
 headers(){return {Authorization:basic(this.login,this.password),"Content-Type":"application/json"};}
 async postAmazonProductsTask({keyword,location_name,language_name,tag,priority=DATAFORSEO_NORMAL_PRIORITY}={}){required(keyword,"keyword");if(priority!==1)throw new Error("DATAFORSEO_HIGH_PRIORITY_BLOCKED");const body=[{keyword:keyword.trim(),location_name:required(location_name,"location_name"),language_name:required(language_name,"language_name"),priority,...(tag?{tag}:{})}];return firstTask(await this.transport({method:"POST",url:`${this.baseUrl}/v3/merchant/amazon/products/task_post`,headers:this.headers(),body}));}
 async postAmazonAsinTask(input={}){return this.#postAsinOperation("asin",input);}
 async postAmazonSellersTask(input={}){return this.#postAsinOperation("sellers",input);}
 async #postAsinOperation(operation,{asin,location_name,language_name,tag,priority=DATAFORSEO_NORMAL_PRIORITY}){const value=required(asin,"asin").toUpperCase();if(!/^[A-Z0-9]{10}$/.test(value))throw new TypeError("asin is invalid.");if(priority!==1)throw new Error("DATAFORSEO_HIGH_PRIORITY_BLOCKED");const body=[{asin:value,location_name:required(location_name,"location_name"),language_name:required(language_name,"language_name"),priority,...(tag?{tag}:{})}];return firstTask(await this.transport({method:"POST",url:`${this.baseUrl}/v3/merchant/amazon/${operation}/task_post`,headers:this.headers(),body}));}
 async getAmazonProductsResult(taskId){return this.#getResult("products",taskId);}
 async getAmazonAsinResult(taskId){return this.#getResult("asin",taskId);}
 async getAmazonSellersResult(taskId){return this.#getResult("sellers",taskId);}
 async #getResult(operation,taskId){required(taskId,"taskId");return firstTask(await this.transport({method:"GET",url:`${this.baseUrl}/v3/merchant/amazon/${operation}/task_get/advanced/${encodeURIComponent(taskId)}`,headers:this.headers()}));}
}
