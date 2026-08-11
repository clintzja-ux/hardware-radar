import assert from "node:assert/strict"; import { AmazonTokenProvider } from "../acquisition/amazon/AmazonTokenProvider.js";
let calls=0, now=0; const p=new AmazonTokenProvider({credentialVersion:"3.1",now:()=>now,fetchToken:async({credentialVersion})=>{calls++; assert.equal(credentialVersion,"3.1"); return {accessToken:`t${calls}`,expiresInSeconds:3600};}});
assert.equal(await p.getAccessToken(),"t1"); now=1000; assert.equal(await p.getAccessToken(),"t1"); assert.equal(calls,1); p.invalidate(); assert.equal(await p.getAccessToken(),"t2");
console.log("AmazonTokenProvider tests passed.");
