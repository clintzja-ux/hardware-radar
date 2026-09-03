import assert from "node:assert/strict"; import { AmazonCreatorsApiClient } from "../acquisition/amazon/AmazonCreatorsApiClient.js";
let invalidated=0,calls=0; const tokenProvider={getAccessToken:async()=>"secret",invalidate:()=>invalidated++}; const rateGovernor={acquire:async()=>{}};
const client=new AmazonCreatorsApiClient({tokenProvider,rateGovernor,partnerTag:"tag-20",sleep:async()=>{},transport:async req=>{calls++; assert.equal(req.headers.Authorization,"Bearer secret"); assert.equal(req.headers["x-marketplace"],"www.amazon.com"); assert.deepEqual(req.body.itemIds,["B000000001"]); if(calls===1) throw Object.assign(new Error("expired"),{status:401}); return {itemsResult:{items:[]}};}});
await client.getItems(["B000000001"]); assert.equal(invalidated,1); assert.equal(calls,2); await assert.rejects(()=>client.getItems(new Array(11).fill("X")),/1-10/);
console.log("AmazonCreatorsApiClient tests passed.");
