import fs from "node:fs"; import path from "node:path"; import { DataForSeoTaskLedger } from "./DataForSeoTaskLedger.js";
export class FileDataForSeoTaskLedger extends DataForSeoTaskLedger {
  constructor(filePath) { super(); if (!filePath) throw new TypeError("filePath is required."); this.filePath=filePath; if (fs.existsSync(filePath)) { const rows=JSON.parse(fs.readFileSync(filePath,"utf8")); for (const row of rows) this.entries.set(row.requestKey,Object.freeze(row)); } }
  record(requestKey, task) { const entry=super.record(requestKey,task); fs.mkdirSync(path.dirname(this.filePath),{recursive:true}); const tmp=`${this.filePath}.tmp`; fs.writeFileSync(tmp,JSON.stringify([...this.entries.values()],null,2)); fs.renameSync(tmp,this.filePath); return entry; }
}
