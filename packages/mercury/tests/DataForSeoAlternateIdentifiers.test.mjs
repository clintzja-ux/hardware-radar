import assert from "node:assert/strict";
import { DataForSeoMerchantApiClient, DataForSeoAcquisitionService } from "../index.js";

let requests=[];
const client=new DataForSeoMerchantApiClient({
  login:"u", password:"p",
  transport:async request=>{ requests.push(request); return {status_code:20000,tasks:[{id:`t${requests.length}`,status_code:20100,cost:.001}]}; }
});
const service=new DataForSeoAcquisitionService({client});

await service.createProductInfoTask({dataDocId:"17540895125310173539"});
assert.equal(requests[0].body[0].data_docid,"17540895125310173539");
assert.equal(requests[0].body[0].product_id,undefined);

await service.createSellersTask({gid:"3789461653582367817",productId:"2093417145096650678",dataDocId:"13019764072701163478"});
assert.equal(requests[1].body[0].gid,"3789461653582367817");
assert.equal(requests[1].body[0].product_id,"2093417145096650678");
assert.equal(requests[1].body[0].data_docid,"13019764072701163478");

await assert.rejects(()=>service.createProductInfoTask({}), /productId, dataDocId, or gid/);
console.log("DataForSEO alternate identifier acquisition tests passed.");
