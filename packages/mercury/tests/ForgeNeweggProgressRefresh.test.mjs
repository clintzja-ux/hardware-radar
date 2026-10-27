import assert from "node:assert/strict";
import {NeweggMandatePanel} from "../../../apps/forge/components/NeweggMandatePanel.js";

const response=model=>({ok:true,json:async()=>structuredClone(model)});
const status={textContent:"",dataset:{}},button={disabled:false,textContent:"Refresh progress"};
const panel=Object.create(NeweggMandatePanel.prototype);
panel.csrf="fixture-csrf";panel.refreshing=false;panel.model={operations:{status:"READY"},readiness:{status:"READY"},execution:null};
panel.root={querySelector:selector=>selector==="[data-refresh-status]"?status:null};
panel.routine={querySelector:selector=>selector==="[data-refresh]"?button:null};
panel.render=()=>{};

let calls=[];
globalThis.fetch=async(path,options)=>{calls.push({path,options});return response(panel.model);};
await panel.refresh({feedback:true});
assert.equal(status.textContent,"No newer routine progress was found.");
assert.equal(status.dataset.state,"success");
assert.equal(calls[0].path,"/operator-api/newegg-mandates");
assert.equal(calls[0].options.cache,"no-store");
assert.equal(calls[0].options.headers["X-Forge-Csrf"],"fixture-csrf");

globalThis.fetch=async()=>response({...panel.model,operations:{status:"SUCCESS"}});
await panel.refresh({feedback:true});
assert.equal(status.textContent,"Live routine progress updated.");

globalThis.fetch=async()=>({ok:false,json:async()=>({error:"PRIVATE_BACKEND_DETAIL"})});
await panel.refresh({feedback:true});
assert.equal(status.textContent,"Refresh failed. Live routine progress is temporarily unavailable.");
assert.doesNotMatch(status.textContent,/PRIVATE_BACKEND_DETAIL/);

let release,concurrentCalls=0;
globalThis.fetch=async()=>{concurrentCalls+=1;await new Promise(resolve=>{release=resolve;});return response(panel.model);};
const first=panel.refresh({feedback:true}),second=panel.refresh({feedback:true});
assert.equal(concurrentCalls,1);
assert.equal(button.disabled,true);
assert.equal(button.textContent,"Refreshing…");
release();await Promise.all([first,second]);
assert.equal(button.disabled,false);
assert.equal(button.textContent,"Refresh progress");

console.log("Forge Newegg progress refresh tests passed: 18 cases.");
