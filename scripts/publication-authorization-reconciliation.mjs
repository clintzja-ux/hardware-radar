import path from "node:path";
import { PublicationAuthorizationStateMigration } from "../packages/sentinel/publication/PublicationAuthorizationStateMigration.js";

const args = new Map(process.argv.slice(2).map(value => { const index = value.indexOf("="); return index < 0 ? [value, true] : [value.slice(0, index), value.slice(index + 1)]; }));
const requiredPath = name => { const value = args.get(name); if (typeof value !== "string" || !path.isAbsolute(value)) throw new Error(`PUBLICATION_AUTHORIZATION_RECONCILIATION_${name.slice(2).replaceAll("-", "_").toUpperCase()}_REQUIRED`); return path.resolve(value); };
const mode = String(args.get("--mode") ?? "INSPECT").toUpperCase();
if (!new Set(["INSPECT", "PREPARE", "EXECUTE"]).has(mode)) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_MODE_INVALID");
const owner = new PublicationAuthorizationStateMigration({ legacyStatePath: requiredPath("--legacy-state"), canonicalStatePath: requiredPath("--canonical-state"), auditPath: requiredPath("--audit") });
const input = { expectedLegacyDigest: args.get("--expected-legacy-digest"), expectedCanonicalDigest: args.get("--expected-canonical-digest") };
const result = mode === "INSPECT" ? await owner.inspect() : mode === "PREPARE" ? await owner.prepareReconciliation(input) : await owner.reconcile({ ...input, expectedUnionDigest: args.get("--expected-union-digest"), operatorId: args.get("--operator-id"), confirmation: args.get("--confirmation") });
const safe = structuredClone(result); delete safe.unionText;
console.log(JSON.stringify(safe, null, 2));
