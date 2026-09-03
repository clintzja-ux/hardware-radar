export class DataForSeoTaskLedger {
  constructor() { this.entries = new Map(); }
  has(requestKey) { return this.entries.has(requestKey); }
  requireNew(requestKey) {
    if (this.has(requestKey)) throw new Error(`DATAFORSEO_DUPLICATE_PAID_TASK:${requestKey}`);
  }
  record(requestKey, task) {
    this.requireNew(requestKey);
    const entry = Object.freeze({ requestKey, ...structuredClone(task) });
    this.entries.set(requestKey, entry);
    return entry;
  }
  get(requestKey) { return this.entries.get(requestKey) ?? null; }
  getAll() { return Object.freeze([...this.entries.values()].map(entry=>structuredClone(entry))); }
}
