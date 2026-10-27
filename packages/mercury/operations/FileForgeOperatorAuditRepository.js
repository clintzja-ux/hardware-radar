import crypto from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { FileSingleWriterRunLock, SINGLE_WRITER_LOCK_STATUSES } from "../runtime/FileSingleWriterRunLock.js";

const digest = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

export class FileForgeOperatorAuditRepository {
  constructor({ statePath, runLock } = {}) {
    if (!statePath) throw new TypeError("FORGE_AUDIT_PATH_REQUIRED");
    this.path = resolve(statePath);
    this.lock = runLock ?? new FileSingleWriterRunLock({ lockPath: `${this.path}.lock` });
  }

  async getAll() {
    try {
      const value = JSON.parse(await readFile(this.path, "utf8"));
      if (value.schemaVersion !== "1.0" || !Array.isArray(value.records)) throw new Error();
      return structuredClone(value.records);
    } catch (error) {
      if (error?.code === "ENOENT") return [];
      throw new Error("FORGE_AUDIT_STATE_INVALID");
    }
  }

  async record(input) {
    const outcome = await this.lock.runExclusive(async () => {
      const records = await this.getAll(), auditId = `forge_audit_${digest(input).slice(0, 24)}`;
      const existing = records.find(record => record.auditId === auditId);
      if (existing) return { status: "ALREADY_RECORDED", record: existing };
      const record = { schemaVersion: "1.0", auditId, ...structuredClone(input) };
      await mkdir(dirname(this.path), { recursive: true });
      const temporary = `${this.path}.tmp-${process.pid}-${crypto.randomUUID()}`;
      try {
        await writeFile(temporary, `${JSON.stringify({ schemaVersion: "1.0", records: [...records, record] }, null, 2)}\n`, { flag: "wx" });
        await rename(temporary, this.path);
      } finally { await rm(temporary, { force: true }).catch(() => {}); }
      return { status: "RECORDED", record };
    });
    if (outcome.status !== SINGLE_WRITER_LOCK_STATUSES.COMPLETED) throw new Error("FORGE_AUDIT_BUSY");
    return outcome.result;
  }
}
