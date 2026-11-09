import assert from "node:assert/strict";
import {NeweggMandatePanel} from "../../../apps/forge/components/NeweggMandatePanel.js";

const response=model=>({ok:true,json:async()=>structuredClone(model)});
const status={textContent:"",dataset:{}},button={disabled:false,textContent:"Refresh progress"};
const panel=Object.create(NeweggMandatePanel.prototype);
panel.csrf="fixture-csrf";panel.refreshing=false;panel.model={operations:{status:"READY"},readiness:{status:"READY"},execution:null};
panel.root={querySelector:selector=>selector==="[data-refresh-status]"?status:null};
panel.routine={querySelector:selector=>selector==="[data-refresh]"?button:null};
panel.render=()=>{};
panel.renderOperations=()=>{};

let calls=[];
globalThis.fetch=async(path,options)=>{calls.push({path,options});return response(panel.model);};
await panel.refresh({feedback:true});
assert.equal(status.textContent,"No newer routine progress was found.");
assert.equal(status.dataset.state,"success");
assert.equal(calls[0].path,"/operator-api/newegg-mandates");
assert.equal(calls[1].path,"/operator-api/newegg-operations");
assert.equal(calls[0].options.cache,"no-store");
assert.equal(calls[0].options.headers["X-Forge-Csrf"],"fixture-csrf");

globalThis.fetch=async path=>response(path.endsWith("newegg-mandates")?{...panel.model,operations:{status:"SUCCESS"}}:{current:null,recent:[]});
await panel.refresh({feedback:true});
assert.equal(status.textContent,"Live routine progress updated.");

globalThis.fetch=async()=>({ok:false,json:async()=>({error:"PRIVATE_BACKEND_DETAIL"})});
await panel.refresh({feedback:true});
assert.equal(status.textContent,"Refresh failed. Live routine progress is temporarily unavailable.");
assert.doesNotMatch(status.textContent,/PRIVATE_BACKEND_DETAIL/);

let releases=[],concurrentCalls=0;
globalThis.fetch=async()=>{concurrentCalls+=1;await new Promise(resolve=>{releases.push(resolve);});return response(panel.model);};
const first=panel.refresh({feedback:true}),second=panel.refresh({feedback:true});
assert.equal(concurrentCalls,2);
assert.equal(button.disabled,true);
assert.equal(button.textContent,"Refreshing…");
releases.forEach(resolve=>resolve());await Promise.all([first,second]);
assert.equal(button.disabled,false);
assert.equal(button.textContent,"Refresh progress");

console.log("Forge Newegg progress refresh tests passed: 18 cases.");

const field=()=>({textContent:"",disabled:false,hidden:false,value:"",focused:false,focus(){this.focused=true;}});
const title=field(),summary=field(),impact=field(),confirmationText=field(),confirmationInput=field(),confirmationStatus=field(),confirm=field(),cancel=field();
const confirmationElements=new Map([["[data-title]",title],["[data-summary]",summary],["[data-impact]",impact],["[data-confirmation-text]",confirmationText],["[data-confirmation-input]",confirmationInput],["[data-status]",confirmationStatus],["[data-confirm]",confirm],["[data-cancel]",cancel]]);
const confirmationPanel=Object.create(NeweggMandatePanel.prototype);
confirmationPanel.confirmDialog={open:false,querySelector:selector=>confirmationElements.get(selector),showModal(){this.open=true;},close(){this.open=false;}};
confirmationPanel.confirmInput=confirmationInput;confirmationPanel.confirmButton=confirm;confirmationPanel.confirmationInFlight=false;
confirmationPanel.pending={path:"/operator-api/newegg-acquisition/authorize-reattempt",action:"AUTHORIZE_NEWEGG_REATTEMPT",payload:{mandateId:"fixture-mandate"}};
confirmationPanel.openConfirmation("Authorize another acquisition attempt?","Attempt 2 of 3.","One manual acquisition attempt only.");
assert.equal(confirmationPanel.confirmDialog.open,true);
assert.equal(confirmationText.textContent,"CONFIRM AUTHORIZE_NEWEGG_REATTEMPT");
assert.equal(confirmationInput.focused,true);
assert.equal(confirm.disabled,true);

confirmationInput.value="CONFIRM AUTHORIZE_NEWEGG_REATTEMPT";confirmationPanel.syncConfirmation();
assert.equal(confirm.disabled,false);
let submitted=0,releaseSubmission;
confirmationPanel.request=async(...input)=>{submitted+=1;assert.equal(input[3],"CONFIRM AUTHORIZE_NEWEGG_REATTEMPT");await new Promise(resolve=>{releaseSubmission=resolve;});return{auditId:"audit-fixture"};};
confirmationPanel.refresh=async()=>{};
const submission=confirmationPanel.executePending();
await confirmationPanel.executePending();
assert.equal(submitted,1);
assert.equal(confirm.disabled,true);
assert.equal(cancel.disabled,true);
releaseSubmission();await submission;
assert.equal(confirmationPanel.confirmDialog.open,true);
assert.match(confirmationStatus.textContent,/Recorded\. Audit audit-fixture/);
assert.equal(confirm.hidden,true);
assert.equal(cancel.textContent,"Close");

confirmationPanel.closeConfirmation();
assert.equal(confirmationPanel.confirmDialog.open,false);
assert.equal(confirmationPanel.pending,null);

confirmationPanel.pending={path:"/operator-api/newegg-routine/execute",action:"RUN_NEWEGG_ROUTINE",payload:{intent:"TODAYS_ROUTINE"}};
confirmationPanel.openConfirmation("Run today's routine?","Revalidate routine eligibility.");
confirmationInput.value="CONFIRM RUN_NEWEGG_ROUTINE";confirmationPanel.syncConfirmation();
confirmationPanel.request=async()=>{throw new Error("AUTHORIZATION_EXPIRED");};
await confirmationPanel.executePending();
assert.equal(confirmationPanel.confirmDialog.open,true);
assert.equal(confirmationStatus.textContent,"Nothing changed: AUTHORIZATION_EXPIRED");
assert.equal(confirm.disabled,false);
assert.equal(cancel.disabled,false);

const priorDialog=confirmationPanel.confirmDialog;
confirmationPanel.render=()=>{};
confirmationPanel.model={operations:{status:"READY"},readiness:{status:"READY"},execution:null};
confirmationPanel.csrf="fixture-csrf";confirmationPanel.refreshing=false;
confirmationPanel.root={querySelector:()=>null};confirmationPanel.routine={querySelector:()=>null};
confirmationPanel.renderOperations=()=>{};
globalThis.fetch=async()=>response(confirmationPanel.model);
await confirmationPanel.refresh();
assert.equal(confirmationPanel.confirmDialog,priorDialog);
assert.equal(confirmationPanel.confirmDialog.open,true);
assert.equal(confirmationInput.value,"CONFIRM RUN_NEWEGG_ROUTINE");

console.log("Forge governed confirmation lifecycle tests passed: 24 cases.");
