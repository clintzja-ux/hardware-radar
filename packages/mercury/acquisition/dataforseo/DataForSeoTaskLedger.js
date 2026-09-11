export class DataForSeoTaskLedger {
  constructor() { this.entries = new Map(); }
  has(requestKey) { return this.entries.has(requestKey); }
  requireNew(requestKey) {
    if (this.has(requestKey)) throw new Error(`DATAFORSEO_DUPLICATE_PAID_TASK:${requestKey}`);
  }
  record(requestKey, task) {
    this.requireNew(requestKey);
    if (task?.paidActionIntentId != null) {
      if (typeof task.paidActionIntentId !== "string" || !/^mer_histbootintent_[a-f0-9]{24}$/.test(task.paidActionIntentId)) throw new Error("DATAFORSEO_PAID_ACTION_INTENT_INVALID");
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
