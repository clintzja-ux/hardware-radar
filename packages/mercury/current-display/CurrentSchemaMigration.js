import crypto from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createCurrentDisplaySnapshot, CURRENT_DISPLAY_MULTI_OFFER_SCHEMA_VERSION, CURRENT_DISPLAY_SNAPSHOT_SCHEMA_VERSION } from "./CurrentDisplaySnapshot.js";
import { projectLegacyCurrentOffer, simulateLegacyCurrentOfferMigration } from "./CurrentOfferModel.js";

export const CURRENT_SCHEMA_MIGRATION_VERSION = "MERCURY-CURRENT-SCHEMA-1.1-CANONICAL-MIGRATION-P1-1.0";
const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
const digest = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const legacyFact = offer => {
    const value = structuredClone(offer);
    for (const key of ["offerSchemaVersion", "offerIdentity", "identityMode", "listingIdentity", "commerceChannel", "seller", "actionability"]) delete value[key];
    return value;
};

export function prepareCurrentSchemaMigration(sourceSnapshot) {
    if (sourceSnapshot?.schemaVersion === CURRENT_DISPLAY_MULTI_OFFER_SCHEMA_VERSION) return freeze({ status: "ALREADY_MIGRATED", sourceSnapshotId: sourceSnapshot.snapshotId, targetSchemaVersion: CURRENT_DISPLAY_MULTI_OFFER_SCHEMA_VERSION });
    if (sourceSnapshot?.schemaVersion !== CURRENT_DISPLAY_SNAPSHOT_SCHEMA_VERSION) throw new TypeError("CURRENT_SCHEMA_MIGRATION_SOURCE_INVALID");
    let ambiguousMappings = 0;
    const projectedOffers = sourceSnapshot.offers.map(offer => {
        if (offer.sellerName !== null && offer.sellerName !== undefined && (typeof offer.sellerName !== "string" || offer.sellerName.trim() === "")) ambiguousMappings += 1;
        return projectLegacyCurrentOffer(offer);
    });
    const audit = simulateLegacyCurrentOfferMigration(sourceSnapshot.offers);
    const identities = projectedOffers.map(offer => offer.offerIdentity);
    const collisions = identities.length - new Set(identities).size;
    const factMismatches = sourceSnapshot.offers.filter((offer, index) => stable(offer) !== stable(legacyFact(projectedOffers[index]))).length;
    const freshnessMismatches = sourceSnapshot.offers.filter((offer, index) => offer.observedAt !== projectedOffers[index].observedAt).length;
    const destinationMismatches = sourceSnapshot.offers.filter((offer, index) => offer.destinationId !== projectedOffers[index].destinationId).length;
    if (collisions || ambiguousMappings || factMismatches || freshnessMismatches || destinationMismatches) throw new Error("CURRENT_SCHEMA_MIGRATION_UNSAFE");
    const targetSnapshot = createCurrentDisplaySnapshot({ schemaVersion: CURRENT_DISPLAY_MULTI_OFFER_SCHEMA_VERSION, observedAt: sourceSnapshot.observedAt, importedAt: sourceSnapshot.importedAt, source: sourceSnapshot.source, offers: projectedOffers });
    const identityDigest = digest([...identities].sort());
    const factParityDigest = digest(sourceSnapshot.offers.map(legacyFact));
    const material = { migrationVersion: CURRENT_SCHEMA_MIGRATION_VERSION, sourceSnapshotId: sourceSnapshot.snapshotId, sourceFingerprint: sourceSnapshot.materialFingerprint, targetSnapshotId: targetSnapshot.snapshotId, targetFingerprint: targetSnapshot.materialFingerprint, offerCount: sourceSnapshot.offers.length, identityDigest, factParityDigest };
    const migrationDigest = digest(material);
    return freeze({
        status: "PREPARED", schemaVersion: "1.0", migrationVersion: CURRENT_SCHEMA_MIGRATION_VERSION,
        migrationId: `mer_curmigration_${migrationDigest.slice(0, 24)}`, migrationDigest,
        source: { snapshotId: sourceSnapshot.snapshotId, schemaVersion: sourceSnapshot.schemaVersion, fingerprint: sourceSnapshot.materialFingerprint },
        target: { snapshotId: targetSnapshot.snapshotId, schemaVersion: targetSnapshot.schemaVersion, fingerprint: targetSnapshot.materialFingerprint },
        audit: { offersExamined: sourceSnapshot.offers.length, identitiesDerived: identities.length, uniqueIdentities: new Set(identities).size, collisions, ambiguousMappings, sellerKnown: audit.sellerKnown, sellerUnknown: audit.sellerUnknown, factMismatches, freshnessMismatches, destinationMismatches, identityDigest, factParityDigest },
        authority: "NONE", providerCalls: 0, paidTasks: 0, actualSpendUsd: 0, targetSnapshot
    });
}

export class FileCurrentSchemaMigrationRepository {
    constructor({ statePath } = {}) { if (!statePath) throw new TypeError("CURRENT_SCHEMA_MIGRATION_PATH_REQUIRED"); this.statePath = resolve(statePath); }
    async _read() { try { const value = JSON.parse(await readFile(this.statePath, "utf8")); if (value?.version !== "1.0" || !Array.isArray(value.plans)) throw new Error(); return value; } catch (error) { if (error?.code === "ENOENT") return { version: "1.0", plans: [] }; throw new Error("CURRENT_SCHEMA_MIGRATION_STATE_INVALID"); } }
    async record(plan) { const state = await this._read(), prior = state.plans.find(value => value.migrationId === plan.migrationId); if (prior) { if (prior.migrationDigest !== plan.migrationDigest) throw new Error("CURRENT_SCHEMA_MIGRATION_REPLAY_CONFLICT"); return freeze({ status: "DUPLICATE", plan: prior }); } state.plans.push(structuredClone(plan)); await mkdir(dirname(this.statePath), { recursive: true }); const temp = `${this.statePath}.tmp-${process.pid}-${Date.now()}`; await writeFile(temp, `${JSON.stringify(state, null, 2)}\n`); await rename(temp, this.statePath); return freeze({ status: "RECORDED", plan }); }
    async get(migrationId) { return freeze(structuredClone((await this._read()).plans.find(value => value.migrationId === migrationId) ?? null)); }
}

export class CurrentSchemaMigrationService {
    constructor({ snapshotRepository, migrationRepository } = {}) { if (!snapshotRepository || !migrationRepository) throw new TypeError("CURRENT_SCHEMA_MIGRATION_DEPENDENCIES_REQUIRED"); this.snapshotRepository = snapshotRepository; this.migrationRepository = migrationRepository; }
    async prepare() { const source = (await this.snapshotRepository.getState()).current; const plan = prepareCurrentSchemaMigration(source); if (plan.status === "ALREADY_MIGRATED") return plan; return (await this.migrationRepository.record(plan)).plan; }
    async inspect(migrationId) { const plan = await this.migrationRepository.get(migrationId); if (!plan) throw new Error("CURRENT_SCHEMA_MIGRATION_NOT_FOUND"); const current = (await this.snapshotRepository.getState()).current; return freeze({ status: current?.snapshotId === plan.source.snapshotId && current?.materialFingerprint === plan.source.fingerprint ? "READY" : current?.snapshotId === plan.target.snapshotId ? "ALREADY_MIGRATED" : "SOURCE_CHANGED", migrationId, source: plan.source, target: plan.target, audit: plan.audit, authority: plan.authority }); }
    async execute(migrationId) { const plan = await this.migrationRepository.get(migrationId); if (!plan) throw new Error("CURRENT_SCHEMA_MIGRATION_NOT_FOUND"); const inspection = await this.inspect(migrationId); if (inspection.status === "ALREADY_MIGRATED") return freeze({ status: "ALREADY_MIGRATED", migrationId, snapshotId: plan.target.snapshotId }); if (inspection.status !== "READY") throw new Error("CURRENT_SCHEMA_MIGRATION_SOURCE_CHANGED"); const persistence = await this.snapshotRepository.replaceIfCurrent(plan.targetSnapshot, { expectedCurrentSnapshotId: plan.source.snapshotId, expectedCurrentFingerprint: plan.source.fingerprint }); return freeze({ status: "MIGRATED", migrationId, sourceSnapshotId: plan.source.snapshotId, targetSnapshotId: plan.target.snapshotId, persistence }); }
}
