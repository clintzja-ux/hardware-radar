import fs from "node:fs"; import path from "node:path"; import { DataForSeoTaskLedger } from "./DataForSeoTaskLedger.js";
export class FileDataForSeoTaskLedger extends DataForSeoTaskLedger {
  constructor(filePath) { super(); if (!filePath) throw new TypeError("filePath is required."); this.filePath=filePath; this.reload(); }
  reload() { this.entries.clear(); if (fs.existsSync(this.filePath)) { const rows=JSON.parse(fs.readFileSync(this.filePath,"utf8")); for (const row of rows) this.entries.set(row.requestKey,Object.freeze(row)); } return this; }
  has(requestKey) { this.reload(); return super.has(requestKey); }
  get(requestKey) { this.reload(); return super.get(requestKey); }
  getAll() { this.reload(); return super.getAll(); }
  getByPaidActionIntentId(value) { this.reload(); return super.getByPaidActionIntentId(value); }
  record(requestKey, task) { this.reload(); const entry=DataForSeoTaskLedger.prototype.record.call(this,requestKey,task); fs.mkdirSync(path.dirname(this.filePath),{recursive:true}); const tmp=`${this.filePath}.${process.pid}.tmp`; fs.writeFileSync(tmp,JSON.stringify([...this.entries.values()],null,2)); fs.renameSync(tmp,this.filePath); return entry; }
}
