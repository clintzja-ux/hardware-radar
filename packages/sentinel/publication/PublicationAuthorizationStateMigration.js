import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const sha256 = text => createHash("sha256").update(text).digest("hex");
const freeze = value => Object.freeze(structuredClone(value));
const validState = value => value?.schemaVersion === "1.0" && value.authorizations && value.operations && value.consumptions;

async function readState(file) {
  try {
    const text = await readFile(file, "utf8"), value = JSON.parse(text);
    if (!validState(value)) throw new Error("PUBLICATION_AUTHORIZATION_MIGRATION_STATE_INVALID");
    return { text, value, digest: sha256(text) };
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    if (error?.message === "PUBLICATION_AUTHORIZATION_MIGRATION_STATE_INVALID") throw error;
    throw new Error("PUBLICATION_AUTHORIZATION_MIGRATION_STATE_INVALID");
  }
}

async function readAudit(file) {
  try { return JSON.parse(await readFile(file, "utf8")); }
  catch (error) { if (error?.code === "ENOENT") return null; throw new Error("PUBLICATION_AUTHORIZATION_MIGRATION_AUDIT_INVALID"); }
}

async function atomicWrite(file, text) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  try { await writeFile(temporary, text, { encoding: "utf8", flag: "wx" }); await rename(temporary, file); }
  finally { await rm(temporary, { force: true }); }
}

export class PublicationAuthorizationStateMigration {
  constructor({ legacyStatePath, canonicalStatePath, auditPath, now = () => new Date().toISOString() } = {}) {
    if (![legacyStatePath, canonicalStatePath, auditPath].every(value => typeof value === "string" && path.isAbsolute(value))) throw new Error("PUBLICATION_AUTHORIZATION_MIGRATION_PATHS_INVALID");
    Object.assign(this, { legacyStatePath: path.resolve(legacyStatePath), canonicalStatePath: path.resolve(canonicalStatePath), auditPath: path.resolve(auditPath), now });
  }
  async inspect() {
    const [legacy, canonical, audit] = await Promise.all([readState(this.legacyStatePath), readState(this.canonicalStatePath), readAudit(this.auditPath)]);
    if(audit){
      const validAudit=audit.schemaVersion==="1.0"&&audit.status==="COMPLETED"&&audit.legacyStatePath===this.legacyStatePath&&audit.canonicalStatePath===this.canonicalStatePath&&/^[a-f0-9]{64}$/.test(audit.stateDigest??"")&&audit.canonicalDigest===audit.stateDigest;
      if(!validAudit||!canonical)throw new Error("PUBLICATION_AUTHORIZATION_MIGRATION_AUDIT_INVALID");
      return freeze({status:"CANONICAL_STATE_MIGRATED",legacyDigest:audit.stateDigest,canonicalDigest:canonical.digest,recoveryAllowed:false});
    }
    if (!legacy && !canonical) return freeze({ status: "MIGRATION_SOURCE_MISSING", recoveryAllowed: false });
    if (!legacy) return freeze({ status: "CANONICAL_STATE_PRESENT", canonicalDigest: canonical.digest, recoveryAllowed: false });
    if (canonical && canonical.digest !== legacy.digest) return freeze({ status: "MIGRATION_CONFLICT", legacyDigest: legacy.digest, canonicalDigest: canonical.digest, recoveryAllowed: false });
    if (canonical) return freeze({ status: "MIGRATION_ALREADY_COMPLETE", legacyDigest: legacy.digest, canonicalDigest: canonical.digest, recoveryAllowed: false });
    return freeze({ status: "MIGRATION_READY", legacyDigest: legacy.digest, canonicalDigest: null, recoveryAllowed: true });
  }
  async migrate({ expectedLegacyDigest, operatorId, confirmation } = {}) {
    if (confirmation !== "MIGRATE-LIVE-PRICE-PUBLICATION-AUTHORIZATION-STATE" || typeof operatorId !== "string" || !operatorId.trim()) throw new Error("PUBLICATION_AUTHORIZATION_MIGRATION_CONFIRMATION_REQUIRED");
    const inspection = await this.inspect();
    if (inspection.status !== "MIGRATION_READY" || inspection.legacyDigest !== expectedLegacyDigest) throw new Error(`PUBLICATION_AUTHORIZATION_MIGRATION_NOT_READY:${inspection.status}`);
    const legacy = await readState(this.legacyStatePath), migrationId = `pubauthmig_${sha256(`${legacy.digest}:${this.canonicalStatePath}`).slice(0,24)}`, preparedAt = this.now();
    const prepared = { schemaVersion: "1.0", migrationId, status: "PREPARED", legacyStatePath: this.legacyStatePath, canonicalStatePath: this.canonicalStatePath, stateDigest: legacy.digest, operatorId, preparedAt };
    await atomicWrite(this.auditPath, `${JSON.stringify(prepared, null, 2)}\n`);
    await atomicWrite(this.canonicalStatePath, legacy.text);
    const canonical = await readState(this.canonicalStatePath);
    if (canonical.digest !== legacy.digest) throw new Error("PUBLICATION_AUTHORIZATION_MIGRATION_HASH_MISMATCH");
    const completed = { ...prepared, status: "COMPLETED", completedAt: this.now(), canonicalDigest: canonical.digest };
    await atomicWrite(this.auditPath, `${JSON.stringify(completed, null, 2)}\n`);
    return freeze(completed);
  }
}
