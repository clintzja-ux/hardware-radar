import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  createStaticPublicationReleaseManifest,
  evaluateStaticPublicationRelease,
  staticPublicationArtifactDigest,
  validateStaticPublicationReleaseManifest
} from "../validators/StaticPublicationReleaseControl.js";
import { loadStaticPublicationRelease } from "../../../scripts/static-publication-release-runtime.mjs";

let cases = 0;
const ok = value => { assert.equal(value, true); cases += 1; };
const eq = (actual, expected) => { assert.equal(actual, expected); cases += 1; };
const at = "2026-09-18T12:00:00.000Z";
const expires = "2026-09-19T00:00:00.000Z";
const offer = {
  atlasProductId: "ram_fixture_one", brand: "Fixture", family: "One", series: null, displayName: "Fixture RAM",
  ddrGeneration: "DDR5", formFactor: "DIMM", totalCapacityGb: 32, moduleCount: 2, capacityPerModuleGb: 16,
  speedMtps: 6000, casLatency: 30, retailerId: "RETAILER-0001", retailerName: "Fixture Retailer",
  destinationId: "mer_dest_aaaaaaaaaaaaaaaaaaaaaaaa", destinationUrl: "https://retailer.example/fixture", itemPriceUsd: 100,
  currency: "USD", observedAt: "2026-09-18T11:00:00.000Z", ageHours: 1, freshness: "PUBLIC_CURRENT",
  comparisonSemantics: "ITEM_PRICE", comparisonEligible: true, shippingUsd: null, feesUsd: null, taxesIncluded: false
};
const artifact = {
  schemaVersion: "1.0", policyVersion: "PUBLIC-RAM-CURRENT-RETAIL-001-1.0", asOf: at, state: "AVAILABLE",
  comparisonSemantics: "ITEM_PRICE", disclosure: "Prices shown exclude applicable shipping, taxes, and fees.", freshness: { maxAgeHours: 36 },
  counts: { sourceOffers: 1, publicCurrentEligibleOffers: 1, staleOffers: 0 },
  winners: { overall: offer, ddr5: offer, ddr4: null, laptop: null },
  products: [{ atlasProductId: offer.atlasProductId, status: "CURRENT_PRICE_AVAILABLE", lowerCurrentItemPrice: null, eligibleOfferCount: 1, offers: [offer] }]
};
const artifactText = `${JSON.stringify(artifact, null, 2)}\n`;
const base = { releaseState: "ON", targetEnvironment: "PREVIEW", reason: "fixture release", reviewedBy: "fixture", createdAt: at, artifactRelativePath: "artifacts/fixture.json", artifactText, expiresAt: expires, authorityReference: "fixture-publication-authority", previousReleaseId: null };
const manifest = createStaticPublicationReleaseManifest(base);
ok(validateStaticPublicationReleaseManifest(manifest).valid);
eq(staticPublicationArtifactDigest(artifactText), manifest.artifact.digestSha256);
eq(evaluateStaticPublicationRelease({ manifest: null, targetEnvironment: "PREVIEW", evaluatedAt: at }).reason, "STATIC_RELEASE_MANIFEST_ABSENT");
const off = createStaticPublicationReleaseManifest({ releaseState: "OFF", targetEnvironment: "PREVIEW", reason: "fixture rollback", reviewedBy: "fixture", createdAt: at });
eq(evaluateStaticPublicationRelease({ manifest: off, targetEnvironment: "PREVIEW", evaluatedAt: at }).reason, "STATIC_RELEASE_EXPLICITLY_OFF");
eq(evaluateStaticPublicationRelease({ manifest, artifactText, targetEnvironment: "PREVIEW", evaluatedAt: at }).exposed, true);
eq(evaluateStaticPublicationRelease({ manifest, artifactText, targetEnvironment: "PRODUCTION", evaluatedAt: at }).reason, "STATIC_RELEASE_ENVIRONMENT_MISMATCH");
eq(evaluateStaticPublicationRelease({ manifest, artifactText, targetEnvironment: "PREVIEW", evaluatedAt: "2026-09-19T00:00:00.001Z" }).reason, "STATIC_RELEASE_CERTIFICATION_EXPIRED");
eq(evaluateStaticPublicationRelease({ manifest, targetEnvironment: "PREVIEW", evaluatedAt: at }).reason, "STATIC_RELEASE_ARTIFACT_MISSING");
eq(evaluateStaticPublicationRelease({ manifest, artifactText: artifactText.replace('"sourceOffers": 1', '"sourceOffers": 2'), targetEnvironment: "PREVIEW", evaluatedAt: at }).reason, "STATIC_RELEASE_ARTIFACT_DIGEST_MISMATCH");

for (const mutate of [
  value => { value.schemaVersion = "9.0"; }, value => { value.releaseState = "MAYBE"; },
  value => { value.artifact.schemaVersion = "9.0"; }, value => { value.artifact.relativePath = "../escape.json"; },
  value => { value.certification.state = "UNCERTIFIED"; }, value => { value.certification.bindingDigest = "0".repeat(64); },
  value => { value.targetSurface = "OTHER"; }, value => { value.authorizationId = "private"; }
]) {
  const changed = structuredClone(manifest); mutate(changed); eq(validateStaticPublicationReleaseManifest(changed).valid, false);
}

const staleArtifact = structuredClone(artifact); staleArtifact.products[0].offers[0].observedAt = "2026-09-16T00:00:00.000Z";
const staleText = `${JSON.stringify(staleArtifact, null, 2)}\n`;
const staleManifest = createStaticPublicationReleaseManifest({ ...base, artifactText: staleText });
eq(evaluateStaticPublicationRelease({ manifest: staleManifest, artifactText: staleText, targetEnvironment: "PREVIEW", evaluatedAt: at }).exposed, false);
const privateText = artifactText.replace('"state": "AVAILABLE"', '"providerTaskId": "private",\n  "state": "AVAILABLE"');
const privateManifest = createStaticPublicationReleaseManifest({ ...base, artifactText: privateText });
eq(evaluateStaticPublicationRelease({ manifest: privateManifest, artifactText: privateText, targetEnvironment: "PREVIEW", evaluatedAt: at }).reason, "STATIC_RELEASE_PRIVATE_FIELD_INVALID");
const unknownText = artifactText.replace('"state": "AVAILABLE"', '"unpublishedSourceMetadata": "private",\n  "state": "AVAILABLE"');
const unknownManifest = createStaticPublicationReleaseManifest({ ...base, artifactText: unknownText });
eq(evaluateStaticPublicationRelease({ manifest: unknownManifest, artifactText: unknownText, targetEnvironment: "PREVIEW", evaluatedAt: at }).reason, "STATIC_RELEASE_PUBLIC_ARTIFACT_SHAPE_INVALID");

const dir = await mkdtemp(path.join(os.tmpdir(), "static-release-"));
try {
  await mkdir(path.join(dir, "artifacts"));
  await writeFile(path.join(dir, "release.json"), `${JSON.stringify(manifest)}\n`);
  await writeFile(path.join(dir, "artifacts", "fixture.json"), artifactText);
  eq((await loadStaticPublicationRelease({ manifestPath: path.join(dir, "release.json"), targetEnvironment: "PREVIEW", evaluatedAt: at })).exposed, true);
  eq((await loadStaticPublicationRelease({ manifestPath: path.join(dir, "missing.json"), targetEnvironment: "PREVIEW", evaluatedAt: at })).reason, "STATIC_RELEASE_MANIFEST_ABSENT");
  await writeFile(path.join(dir, "malformed.json"), "{");
  eq((await loadStaticPublicationRelease({ manifestPath: path.join(dir, "malformed.json"), targetEnvironment: "PREVIEW", evaluatedAt: at })).exposed, false);
} finally { await rm(dir, { recursive: true, force: true }); }

const replay = createStaticPublicationReleaseManifest(base);
assert.deepEqual(replay, manifest); cases += 1;
eq(createStaticPublicationReleaseManifest({ releaseState: "OFF", targetEnvironment: "PREVIEW", reason: "fixture rollback", reviewedBy: "fixture", createdAt: at, previousReleaseId: manifest.releaseId }).rollback.previousReleaseId, manifest.releaseId);
console.log(`Static publication release control tests passed: ${cases} cases.`);
