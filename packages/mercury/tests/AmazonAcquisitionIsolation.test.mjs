import assert from "node:assert/strict"; import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url)); for(const f of ["AmazonCreatorsApiClient.js","AmazonCreatorsAcquisitionService.js"]){const s=fs.readFileSync(path.join(here,"../acquisition/amazon",f),"utf8"); assert.equal(/process\.env|client_secret|clientSecret/.test(s),false);}
console.log("AmazonAcquisitionIsolation tests passed.");
