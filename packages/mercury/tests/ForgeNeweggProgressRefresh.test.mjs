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

const field=()=>({textContent:"",disabled:false,hidden:false,value:"",focused:false,dataset:{},focus(){this.focused=true;}});
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
assert.equal(confirmationStatus.textContent,"Enter the exact confirmation phrase to continue.");

let submitted=0;
confirmationPanel.request=async()=>{submitted+=1;return{status:"ACCEPTED",auditId:"unexpected"};};
confirmationInput.value="";confirmationPanel.syncConfirmation({announce:true});
await confirmationPanel.submitConfirmation({preventDefault(){}});
assert.equal(submitted,0);
assert.equal(confirmationStatus.textContent,"Enter the exact confirmation phrase to continue.");
confirmationInput.value="CONFIRM RUN_NEWEGG_ROUTINE ";confirmationPanel.syncConfirmation({announce:true});
await confirmationPanel.submitConfirmation({preventDefault(){}});
assert.equal(submitted,0);
assert.equal(confirmationStatus.textContent,"Confirmation phrase does not match.");

confirmationInput.value="CONFIRM AUTHORIZE_NEWEGG_REATTEMPT";confirmationPanel.syncConfirmation();
assert.equal(confirm.disabled,false);
let releaseSubmission;submitted=0;
confirmationPanel.request=async(...input)=>{submitted+=1;assert.equal(input[3],"CONFIRM AUTHORIZE_NEWEGG_REATTEMPT");assert.match(input[4],/^[a-f0-9]{32}$/);await new Promise(resolve=>{releaseSubmission=resolve;});return{status:"ACCEPTED",auditId:"audit-fixture",result:{requestId:input[4]}};};
confirmationPanel.refresh=async()=>{};
const submission=confirmationPanel.submitConfirmation({preventDefault(){}});
await confirmationPanel.submitConfirmation({preventDefault(){}});
assert.equal(submitted,1);
assert.equal(confirm.disabled,true);
assert.equal(cancel.disabled,true);
assert.match(confirmationStatus.textContent,/Submitting governed request/);
releaseSubmission();await submission;
assert.equal(confirmationPanel.confirmDialog.open,true);
assert.match(confirmationStatus.textContent,/Accepted for governed dispatch\. Operation request/);
assert.match(confirmationStatus.textContent,/Audit audit-fixture/);
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
assert.equal(confirmationStatus.textContent,"Submission rejected: AUTHORIZATION_EXPIRED");
assert.equal(confirm.disabled,false);
assert.equal(cancel.disabled,false);

confirmationPanel.pendingRequestId=null;
confirmationPanel.request=async()=>{throw Object.assign(new Error("FORGE_OPERATOR_NETWORK_FAILURE"),{ambiguous:true});};
await confirmationPanel.executePending();
assert.match(confirmationStatus.textContent,/Submission outcome is uncertain/);
assert.match(confirmationStatus.textContent,/Inspect Current operation before resubmitting/);
assert.equal(confirm.hidden,true);

confirmationPanel.confirmButton.hidden=false;confirmationPanel.pendingRequestId=null;
confirmationPanel.request=async()=>({status:"ACCEPTED",auditId:"audit-delayed",result:{requestId:"delayedrequest01"}});
confirmationPanel.refresh=async()=>{throw new Error("REFRESH_FAILED");};
await confirmationPanel.executePending();
assert.match(confirmationStatus.textContent,/Accepted for governed dispatch\. Operation request delayedrequest01/);
assert.match(confirmationStatus.textContent,/Live status refresh failed/);

let requestOptions;
globalThis.fetch=async(_path,options)=>{requestOptions=options;return{ok:false,status:401,json:async()=>({error:"FORGE_OPERATOR_UNAUTHORIZED"})};};
await assert.rejects(()=>NeweggMandatePanel.prototype.request.call({csrf:"fixture-csrf"},"/operator-api/newegg-routine/execute","RUN_NEWEGG_ROUTINE",{intent:"TODAYS_ROUTINE"},"CONFIRM RUN_NEWEGG_ROUTINE","requestfixture01"),error=>error.message==="FORGE_OPERATOR_UNAUTHORIZED"&&error.httpStatus===401);
assert.equal(requestOptions.headers["X-Forge-Csrf"],"fixture-csrf");
assert.equal(JSON.parse(requestOptions.body).requestId,"requestfixture01");
globalThis.fetch=async()=>{throw new TypeError("network unavailable");};
await assert.rejects(()=>NeweggMandatePanel.prototype.request.call({csrf:"fixture-csrf"},"/operator-api/newegg-routine/execute","RUN_NEWEGG_ROUTINE",{},"CONFIRM RUN_NEWEGG_ROUTINE","requestfixture02"),error=>error.ambiguous===true&&error.message==="FORGE_OPERATOR_NETWORK_FAILURE");
globalThis.fetch=async()=>({ok:true,status:200,json:async()=>{throw new SyntaxError("truncated");}});
await assert.rejects(()=>NeweggMandatePanel.prototype.request.call({csrf:"fixture-csrf"},"/operator-api/newegg-routine/execute","RUN_NEWEGG_ROUTINE",{},"CONFIRM RUN_NEWEGG_ROUTINE","requestfixture03"),error=>error.ambiguous===true&&error.message==="FORGE_OPERATOR_RESPONSE_INVALID");

const priorDialog=confirmationPanel.confirmDialog;
confirmationPanel.render=()=>{};
confirmationPanel.model={operations:{status:"READY"},readiness:{status:"READY"},execution:null};
confirmationPanel.csrf="fixture-csrf";confirmationPanel.refreshing=false;
confirmationPanel.root={querySelector:()=>null};confirmationPanel.routine={querySelector:()=>null};
confirmationPanel.renderOperations=()=>{};
globalThis.fetch=async()=>response(confirmationPanel.model);
delete confirmationPanel.refresh;
await confirmationPanel.refresh();
assert.equal(confirmationPanel.confirmDialog,priorDialog);
assert.equal(confirmationPanel.confirmDialog.open,true);
assert.equal(confirmationInput.value,"CONFIRM RUN_NEWEGG_ROUTINE");

console.log("Forge governed confirmation lifecycle tests passed: 49 cases.");
