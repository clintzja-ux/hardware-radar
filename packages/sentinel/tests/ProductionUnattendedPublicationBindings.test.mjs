import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FileRecurringPublicationAuthorityRepository } from "../publication/UnattendedLivePricePublication.js";
import { CloudflarePagesDeploymentObserver, ProductionForgeUnattendedPublicationProvider, RecurringPublicationMandateOperatorService } from "../publication/ProductionUnattendedPublicationBindings.js";

const root = await mkdtemp(path.join(os.tmpdir(), "hr-publication-bindings-"));
try {
  const repository = new FileRecurringPublicationAuthorityRepository({ statePath: path.join(root, "authority.json") });
  const service = new RecurringPublicationMandateOperatorService({ repository, now: () => "2026-10-17T00:00:00Z" });
  await assert.rejects(() => service.create({ operatorId: "operator:test", validFrom: "2026-10-17T00:00:00Z", expiresAt: "2026-11-16T00:00:00Z" }), /CONFIRMATION/);
  await assert.rejects(() => service.create({ operatorId: "operator:test", validFrom: "2026-10-17T00:00:00Z", expiresAt: "2026-12-17T00:00:00Z", confirmation: "CREATE-UNATTENDED-PUBLICATION-MANDATE" }), /WINDOW_INVALID/);
  const mandate = await service.create({ operatorId: "operator:test", validFrom: "2026-10-17T00:00:00Z", expiresAt: "2026-11-16T00:00:00Z", confirmation: "CREATE-UNATTENDED-PUBLICATION-MANDATE" });
  assert.equal(mandate.status, "ENABLED");
  await service.transition({ mandateId: mandate.mandateId, status: "PAUSED", operatorId: "operator:test", confirmation: "PAUSED-UNATTENDED-PUBLICATION-MANDATE" });
  const revoked = await service.transition({ mandateId: mandate.mandateId, status: "REVOKED", operatorId: "operator:test", confirmation: "REVOKED-UNATTENDED-PUBLICATION-MANDATE" });
  assert.equal(revoked.status, "REVOKED");
  assert.equal((await service.inspect()).audit.length, 3);
  const health = await new ProductionForgeUnattendedPublicationProvider({ repository }).load({ asOf: "2026-10-17T01:00:00Z" });
  assert.equal(health.status, "REVOKED"); assert.equal(health.readOnly, true); assert.equal(health.mutationAuthorized, false);
  const observer = new CloudflarePagesDeploymentObserver({ accountId: "account", projectName: "project", tokenProvider: async () => "secret", fetchImpl: async () => ({ ok: true, json: async () => ({ result: [{ deployment_trigger: { metadata: { commit_hash: "abc" } }, latest_stage: { status: "success" } }] }) }) });
  assert.equal((await observer.observe({ commit: "abc" })).status, "SUCCESS");
  await assert.rejects(() => new CloudflarePagesDeploymentObserver({ accountId: "account", projectName: "project", tokenProvider: async () => null }).observe({ commit: "abc" }), /CREDENTIAL_REQUIRED/);
  await mkdir(path.join(root, "empty")); await writeFile(path.join(root, "empty", "marker"), "fixture");
  console.log("Production unattended publication binding tests passed.");
} finally { await rm(root, { recursive: true, force: true }); }
