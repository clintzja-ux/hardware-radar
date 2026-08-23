import crypto from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { validateIdentityReviewDecision, isValidIdentityReviewer } from "../IdentityReviewDecision.js";
import { validateIdentityReviewAuditRemediation } from "../IdentityReviewAuditRemediation.js";

const VERSION="1.0";
const initial=()=>({version:VERSION,sequence:0,decisions:{},bySubject:{},idempotency:{},remediationSequence:0,remediations:{},remediationByDecision:{},remediationIdempotency:{}});
const clone=x=>structuredClone(x);
const freeze=x=>Object.freeze(x);
function subjectKey(d){ return d.subjectType === "PRODUCT_IDENTITY" ? `PRODUCT_IDENTITY:${d.atlasProductId}` : `MERCHANT_IDENTITY:${d.canonicalDomain}`; }
function fingerprint(d){ return crypto.createHash("sha256").update(JSON.stringify(d)).digest("hex"); }
function decisionHash(d){return crypto.createHash("sha256").update(JSON.stringify(d)).digest("hex");}
function sameApprovalIntent(left,right){const omit=x=>{const copy=clone(x);for(const key of ["reviewedAt","identityReviewDecisionId","sequence","recordedAt"])delete copy[key];return copy;};return JSON.stringify(omit(left))===JSON.stringify(omit(right));}
function sameRemediationIntent(left,right){const omit=x=>{const copy=clone(x);for(const key of ["remediatedAt","identityReviewRemediationId","sequence","recordedAt"])delete copy[key];return copy;};return JSON.stringify(omit(left))===JSON.stringify(omit(right));}

export class FileIdentityReviewDecisionRepository {
  constructor({statePath,now=()=>new Date().toISOString(),requireExisting=false}={}) { if(!statePath) throw new TypeError("statePath is required."); this.statePath=resolve(statePath);this.now=now;this.requireExisting=requireExisting;this.queue=Promise.resolve(); }
  async _withLock(fn){const task=this.queue.then(fn,fn);this.queue=task.catch(()=>{});return task;}
  _validateState(x){
    if(x?.version!==VERSION||!Number.isInteger(x.sequence)||x.sequence<0||!x.decisions||Array.isArray(x.decisions)||!x.bySubject||Array.isArray(x.bySubject)||!x.idempotency||Array.isArray(x.idempotency))throw new Error("Mercury identity review state is corrupt or unsupported.");
    x.remediationSequence??=0;x.remediations??={};x.remediationByDecision??={};x.remediationIdempotency??={};
    if(!Number.isInteger(x.remediationSequence)||x.remediationSequence<0||Array.isArray(x.remediations)||Array.isArray(x.remediationByDecision)||Array.isArray(x.remediationIdempotency))throw new Error("Mercury identity review remediation state is corrupt or unsupported.");
    const sequences=new Set();const approvedBySubject=new Set();
    for(const [id,decision] of Object.entries(x.decisions)){
      const report=validateIdentityReviewDecision(decision,{allowInvalidReviewer:true});if(!report.valid||decision.identityReviewDecisionId!==id||!Number.isInteger(decision.sequence)||decision.sequence<1||!Number.isFinite(Date.parse(decision.recordedAt)))throw new Error(`Mercury identity review decision is invalid:${id}`);
      if(sequences.has(decision.sequence))throw new Error("Mercury identity review state has duplicate sequence values.");sequences.add(decision.sequence);
      const key=subjectKey(decision);if(!Array.isArray(x.bySubject[key])||!x.bySubject[key].includes(id))throw new Error(`Mercury identity review subject index is invalid:${id}`);
      if(decision.decisionOutcome==="APPROVED"){if(approvedBySubject.has(key))throw new Error(`Mercury identity review state has conflicting approvals:${key}`);approvedBySubject.add(key);}
    }
    if(Math.max(0,...sequences)!==x.sequence)throw new Error("Mercury identity review sequence is inconsistent.");
    for(const id of Object.values(x.idempotency))if(!x.decisions[id])throw new Error("Mercury identity review idempotency index is invalid.");
    const remediationSequences=new Set();
    for(const [id,remediation] of Object.entries(x.remediations)){
      const report=validateIdentityReviewAuditRemediation(remediation);const original=x.decisions[remediation.originalDecisionId];
      if(!report.valid||remediation.identityReviewRemediationId!==id||!Number.isInteger(remediation.sequence)||remediation.sequence<1||!Number.isFinite(Date.parse(remediation.recordedAt)))throw new Error(`Mercury identity review remediation is invalid:${id}`);
      if(!original||remediation.subjectType!==original.subjectType||remediation.originalReviewedBy!==original.reviewedBy||JSON.stringify(remediation.supportingEvidenceReferences)!==JSON.stringify(original.supportingEvidenceReferences)||remediation.originalDecisionHash!==decisionHash(original)||isValidIdentityReviewer(original.reviewedBy))throw new Error(`Mercury identity review remediation binding is invalid:${id}`);
      if(remediationSequences.has(remediation.sequence))throw new Error("Mercury identity review remediation has duplicate sequence values.");remediationSequences.add(remediation.sequence);
      if(x.remediationByDecision[remediation.originalDecisionId]!==id)throw new Error(`Mercury identity review remediation index is invalid:${id}`);
    }
    if(Math.max(0,...remediationSequences)!==x.remediationSequence)throw new Error("Mercury identity review remediation sequence is inconsistent.");
    for(const id of Object.values(x.remediationIdempotency))if(!x.remediations[id])throw new Error("Mercury identity review remediation idempotency index is invalid.");
    return x;
  }
  async _read(){try{return this._validateState(JSON.parse(await readFile(this.statePath,"utf8")));}catch(e){if(e?.code==="ENOENT"&&!this.requireExisting)return initial();if(e?.code==="ENOENT")throw new Error(`IDENTITY_REVIEW_STATE_MISSING:${this.statePath}`);throw e;}}
  async _commit(state){await mkdir(dirname(this.statePath),{recursive:true});const temp=`${this.statePath}.tmp-${process.pid}-${Date.now()}`;await writeFile(temp,`${JSON.stringify(state,null,2)}\n`,`utf8`);await rename(temp,this.statePath);}
  async recordDecision(decision){const report=validateIdentityReviewDecision(decision);if(!report.valid)throw new TypeError(report.errors.join(" "));return this._withLock(async()=>{const state=await this._read();const fp=fingerprint(decision);if(state.idempotency[fp])return freeze(clone(state.decisions[state.idempotency[fp]]));const key=subjectKey(decision);const history=(state.bySubject[key]??[]).map(id=>state.decisions[id]);const approved=history.find(x=>x.decisionOutcome==="APPROVED");if(approved){if(decision.decisionOutcome==="APPROVED"&&sameApprovalIntent(approved,decision))return freeze(clone(approved));throw new Error("IDENTITY_REVIEW_CANONICAL_STATE_CONFLICT");}const sequence=state.sequence+1;const id=`mer_idrev_${String(sequence).padStart(9,"0")}`;const record={...clone(decision),identityReviewDecisionId:id,sequence,recordedAt:this.now()};state.sequence=sequence;state.decisions[id]=record;state.bySubject[key]??=[];state.bySubject[key].push(id);state.idempotency[fp]=id;await this._commit(state);return freeze(clone(record));});}
  async recordRemediation(remediation){const report=validateIdentityReviewAuditRemediation(remediation);if(!report.valid)throw new TypeError(report.errors.join(" "));return this._withLock(async()=>{const state=await this._read();const original=state.decisions[remediation.originalDecisionId];if(!original)throw new Error("IDENTITY_REVIEW_REMEDIATION_DECISION_NOT_FOUND");if(isValidIdentityReviewer(original.reviewedBy))throw new Error("IDENTITY_REVIEW_REMEDIATION_NOT_REQUIRED");const expected={...remediation,subjectType:original.subjectType,originalReviewedBy:original.reviewedBy,supportingEvidenceReferences:[...original.supportingEvidenceReferences],originalDecisionHash:decisionHash(original)};if(JSON.stringify(expected)!==JSON.stringify(remediation))throw new Error("IDENTITY_REVIEW_REMEDIATION_BINDING_MISMATCH");const fp=fingerprint(remediation);if(state.remediationIdempotency[fp])return freeze(clone(state.remediations[state.remediationIdempotency[fp]]));const existingId=state.remediationByDecision[original.identityReviewDecisionId];if(existingId){const existing=state.remediations[existingId];if(sameRemediationIntent(existing,remediation))return freeze(clone(existing));throw new Error("IDENTITY_REVIEW_REMEDIATION_CONFLICT");}const sequence=state.remediationSequence+1;const id=`mer_idrem_${String(sequence).padStart(9,"0")}`;const record={...clone(remediation),identityReviewRemediationId:id,sequence,recordedAt:this.now()};state.remediationSequence=sequence;state.remediations[id]=record;state.remediationByDecision[original.identityReviewDecisionId]=id;state.remediationIdempotency[fp]=id;await this._commit(state);return freeze(clone(record));});}
  async getById(id){const state=await this._read();return state.decisions[id]?freeze(clone(state.decisions[id])):null;}
  async getHistoryForSubject({subjectType,atlasProductId=null,canonicalDomain=null}={}){const key=subjectType==="PRODUCT_IDENTITY"?`PRODUCT_IDENTITY:${atlasProductId}`:`MERCHANT_IDENTITY:${canonicalDomain}`;const state=await this._read();return freeze((state.bySubject[key]??[]).map(id=>freeze(clone(state.decisions[id]))));}
  async getAll(){const state=await this._read();return freeze(Object.values(state.decisions).sort((a,b)=>a.sequence-b.sequence).map(x=>freeze(clone(x))));}
  async getAllRemediations(){const state=await this._read();return freeze(Object.values(state.remediations).sort((a,b)=>a.sequence-b.sequence).map(x=>freeze(clone(x))));}
}
export default FileIdentityReviewDecisionRepository;
