export class AmazonRateGovernor {
  constructor({ minIntervalMs = 1000, now = () => Date.now(), sleep = ms => new Promise(r => setTimeout(r, ms)) } = {}) { this.minIntervalMs=minIntervalMs; this.now=now; this.sleep=sleep; this.lastAt=null; }
  async acquire() { if (this.lastAt !== null) { const wait = this.minIntervalMs - (this.now() - this.lastAt); if (wait > 0) await this.sleep(wait); } this.lastAt = this.now(); }
}
export default AmazonRateGovernor;
