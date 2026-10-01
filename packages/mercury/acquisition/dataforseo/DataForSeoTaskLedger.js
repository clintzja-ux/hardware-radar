export class DataForSeoTaskLedger {
  constructor() { this.entries = new Map(); }
  has(requestKey) { return this.entries.has(requestKey); }
  requireNew(requestKey) {
    if (this.has(requestKey)) throw new Error(`DATAFORSEO_DUPLICATE_PAID_TASK:${requestKey}`);
  }
  record(requestKey, task) {
    this.requireNew(requestKey);
    if (task?.paidActionIntentId != null) {
      const bootstrap=/^mer_histbootintent_[a-f0-9]{24}$/.test(task.paidActionIntentId),repeat=/^mer_repeatintent_[a-f0-9]{24}$/.test(task.paidActionIntentId);
      if (!bootstrap&&!repeat) throw new Error("DATAFORSEO_PAID_ACTION_INTENT_INVALID");
      if(repeat&&(!["SELLERS","AMAZON_SELLERS"].includes(task.kind)||!/^mer_repeatprep_[a-f0-9]{24}$/.test(task.preparedObservationId??"")||!/^mer_repeatcycle_[a-f0-9]{24}$/.test(task.acquisitionCycleId??"")||!/^mer_repeatauth_[a-f0-9]{24}$/.test(task.repeatAuthorizationId??"")||typeof task.atlasProductId!=="string"||!/^[a-f0-9]{64}$/.test(task.reusableIdentityDigest??"")||!/^[a-f0-9]{64}$/.test(task.sourceRightsProfileDigest??"")))throw new Error("DATAFORSEO_REPEAT_INTENT_LINEAGE_INVALID");
      if (this.getByPaidActionIntentId(task.paidActionIntentId).length) throw new Error("PAID_ACTION_INTENT_CONFLICT");
    }
    const entry = Object.freeze({ requestKey, ...structuredClone(task) });
    this.entries.set(requestKey, entry);
    return entry;
  }
  get(requestKey) { return this.entries.get(requestKey) ?? null; }
  getAll() { return Object.freeze([...this.entries.values()].map(entry=>structuredClone(entry))); }
  getByPaidActionIntentId(value) { return Object.freeze([...this.entries.values()].filter(entry=>entry.paidActionIntentId===value).map(entry=>structuredClone(entry))); }
}
