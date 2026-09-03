import assert from "node:assert/strict"; import { AmazonRateGovernor } from "../acquisition/amazon/AmazonRateGovernor.js";
let now=0, waits=[]; const g=new AmazonRateGovernor({now:()=>now,sleep:async ms=>{waits.push(ms); now+=ms;}}); await g.acquire(); now=200; await g.acquire(); assert.deepEqual(waits,[800]);
console.log("AmazonRateGovernor tests passed.");
