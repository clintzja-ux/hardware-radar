import assert from "node:assert/strict"; import { loadDataForSeoCredentials } from "../index.js";
assert.deepEqual(loadDataForSeoCredentials({DATAFORSEO_LOGIN:" a ",DATAFORSEO_PASSWORD:" b "}),{login:"a",password:"b"});
assert.throws(()=>loadDataForSeoCredentials({}),/DATAFORSEO_CREDENTIALS_MISSING/); console.log("DataForSEO config tests passed.");
