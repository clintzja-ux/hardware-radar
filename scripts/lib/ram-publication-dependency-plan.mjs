import { createHash } from "node:crypto";
import { calculateRamProductLastmod, RAM_PUBLICATION_DEPENDENCIES, resolveRamPublicationArtifacts } from "./ram-publication-dependency-contract.mjs";

const freeze = value => Object.freeze(structuredClone(value));
const digest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const required = (value, code) => { if (typeof value !== "string" || !value.trim()) throw new Error(code); return value; };

export { RAM_PUBLICATION_DEPENDENCIES };

export function planRamPublicationDependencies({ changeType, atlasProductId, publicPath, atlasSourcePath = null, inputIdentity, inputDigest, sitemapLastmodAdvances = true, includeAtlasSourceRecord = true } = {}) {
  if (!RAM_PUBLICATION_DEPENDENCIES[changeType]) throw new Error("PUBLICATION_DEPENDENCY_CHANGE_TYPE_INVALID");
  required(atlasProductId, "PUBLICATION_DEPENDENCY_PRODUCT_REQUIRED");
  required(publicPath, "PUBLICATION_DEPENDENCY_ROUTE_REQUIRED");
  required(inputIdentity, "PUBLICATION_DEPENDENCY_INPUT_IDENTITY_REQUIRED");
  if (!/^[a-f0-9]{64}$/.test(inputDigest ?? "")) throw new Error("PUBLICATION_DEPENDENCY_INPUT_DIGEST_REQUIRED");
  if (changeType === "ATLAS_SPECIFICATION" && includeAtlasSourceRecord) required(atlasSourcePath, "PUBLICATION_DEPENDENCY_ATLAS_SOURCE_PATH_REQUIRED");
  const { artifactFamilies, artifactPaths } = resolveRamPublicationArtifacts({ changeType, publicPath, atlasSourcePath, sitemapLastmodAdvances, includeAtlasSourceRecord });
  const material = { schemaVersion: "1.0", changeType, atlasProductId, publicPath, atlasSourcePath, inputIdentity, inputDigest, sitemapLastmodAdvances, includeAtlasSourceRecord, artifactFamilies, artifactPaths };
  return freeze({ ...material, planDigest: digest(material), comparisonComplete: true, mutationAuthorized: false });
}

export function compareRamPublicationPlan({ plan, actualChangedPaths, comparisonComplete } = {}) {
  if (!plan?.planDigest || comparisonComplete !== true || !Array.isArray(actualChangedPaths)) throw new Error("PUBLICATION_DEPENDENCY_COMPARISON_INCOMPLETE");
  const actual = [...new Set(actualChangedPaths.map(value => String(value).replaceAll("\\", "/")))].sort();
  if (actual.length !== actualChangedPaths.length || actual.some(value => !value || value.startsWith("/") || value.includes(".."))) throw new Error("PUBLICATION_DEPENDENCY_ARTIFACT_INVENTORY_INVALID");
  const expected = [...plan.artifactPaths].sort();
  const unexpectedPaths = actual.filter(value => !expected.includes(value));
  const missingPaths = expected.filter(value => !actual.includes(value));
  return freeze({
    schemaVersion: "1.0",
    status: unexpectedPaths.length || missingPaths.length ? "DEPENDENCY_MISMATCH" : "DEPENDENCY_MATCH",
    expectedPaths: expected,
    actualPaths: actual,
    unexpectedPaths,
    missingPaths,
    replayDigest: digest({ planDigest: plan.planDigest, actual })
  });
}

const byProduct = value => new Map((value?.products ?? []).map(product => [product.atlasProductId, product]));
const changedIds = (next, prior) => [...new Set([...next.keys(), ...prior.keys()])].filter(id => JSON.stringify(next.get(id) ?? null) !== JSON.stringify(prior.get(id) ?? null)).sort();
const routeLastmod = ({ product, current, chronology }) => calculateRamProductLastmod({
  atlasModifiedAt: product?.identity?.updatedAt,
  currentObservedAt: (current?.offers ?? []).map(offer => offer.observedAt),
  historyObservedAt: (chronology?.timestampGroups ?? []).map(group => group.observedAt)
});

export function createRamPublicationShadowPlan({ candidateArtifact, predecessorArtifact, atlasProducts = [], atlasManifestEntries = [], scope = "PRICE_PUBLICATION" } = {}) {
  const candidate = candidateArtifact?.manifest, predecessor = predecessorArtifact?.manifest;
  if (!candidate?.inputs || !predecessor?.inputs || !candidateArtifact?.fileTexts || !predecessorArtifact?.fileTexts) throw new Error("PUBLICATION_DEPENDENCY_INPUT_EVIDENCE_INCOMPLETE");
  const candidateCatalog = JSON.parse(candidateArtifact.fileTexts.catalog), predecessorCatalog = JSON.parse(predecessorArtifact.fileTexts.catalog);
  const candidateCurrent = JSON.parse(candidateArtifact.fileTexts.current), predecessorCurrent = JSON.parse(predecessorArtifact.fileTexts.current);
  const candidateChronology = JSON.parse(candidateArtifact.fileTexts.chronology), predecessorChronology = JSON.parse(predecessorArtifact.fileTexts.chronology);
  const catalogs = [byProduct(candidateCatalog), byProduct(predecessorCatalog)], currents = [byProduct(candidateCurrent), byProduct(predecessorCurrent)], chronologies = [byProduct(candidateChronology), byProduct(predecessorChronology)];
  const atlasChanged = changedIds(...catalogs), currentChanged = changedIds(...currents), productSources = new Map(atlasManifestEntries.map(entry => [entry.atlasProductId, entry.path])), canonicalProducts = new Map(atlasProducts.map(product => [product.identity?.atlasProductId, product]));
  const contributions = [];
  for (const atlasProductId of atlasChanged) {
    const catalogProduct = catalogs[0].get(atlasProductId) ?? catalogs[1].get(atlasProductId), atlasSourcePath = productSources.get(atlasProductId);
    contributions.push(planRamPublicationDependencies({ changeType:"ATLAS_SPECIFICATION", atlasProductId, publicPath:catalogProduct?.publicPath, atlasSourcePath, inputIdentity:`atlas-catalog:${atlasProductId}`, inputDigest:candidate.inputs.atlasCatalog, sitemapLastmodAdvances:true, includeAtlasSourceRecord:scope !== "PRICE_PUBLICATION" }));
  }
  for (const atlasProductId of currentChanged) {
    const catalogProduct = catalogs[0].get(atlasProductId) ?? catalogs[1].get(atlasProductId), product = canonicalProducts.get(atlasProductId), nextLastmod = routeLastmod({ product, current:currents[0].get(atlasProductId), chronology:chronologies[0].get(atlasProductId) }), priorLastmod = routeLastmod({ product, current:currents[1].get(atlasProductId), chronology:chronologies[1].get(atlasProductId) });
    contributions.push(planRamPublicationDependencies({ changeType:"MERCURY_CURRENT", atlasProductId, publicPath:catalogProduct?.publicPath, inputIdentity:`mercury-current:${candidate.inputs.currentSnapshotId ?? candidate.inputs.currentState}`, inputDigest:candidate.inputs.currentState, sitemapLastmodAdvances:nextLastmod !== priorLastmod }));
  }
  const artifactPaths = [...new Set(contributions.flatMap(value => value.artifactPaths))].sort(), producerIds = [...new Set(contributions.map(value => value.changeType === "ATLAS_SPECIFICATION" ? "ATLAS" : "MERCURY_CURRENT"))].sort(), inputBindings = [
    ...(atlasChanged.length ? [{ producerId:"ATLAS", identity:`atlas-catalog:${candidate.inputs.atlasManifest}`, digest:candidate.inputs.atlasCatalog }] : []),
    ...(currentChanged.length ? [{ producerId:"MERCURY_CURRENT", identity:`current-snapshot:${candidate.inputs.currentSnapshotId ?? "UNKNOWN"}`, digest:candidate.inputs.currentState }] : [])
  ];
  const material = { schemaVersion:"1.0", scope, producerIds, inputBindings, atlasChangedProductIds:atlasChanged, currentChangedProductIds:currentChanged, artifactPaths, contributionDigests:contributions.map(value => value.planDigest).sort(), unsupportedInputChanges:{ history:candidate.inputs.history !== predecessor.inputs.history, destinations:candidate.inputs.destinations !== predecessor.inputs.destinations } };
  return freeze({ ...material, planDigest:digest(material), observationOnly:true });
}

export function observeRamPublicationShadow({ plan, changedPaths, comparisonComplete } = {}) {
  const publicPaths = (changedPaths ?? []).filter(value => String(value).replaceAll("\\", "/").startsWith("public/"));
  const comparison = compareRamPublicationPlan({ plan:{ ...plan, artifactPaths:plan.artifactPaths }, actualChangedPaths:publicPaths, comparisonComplete });
  return freeze({ schemaVersion:"1.0", status:"OBSERVED", producerIds:plan.producerIds, inputBindings:plan.inputBindings, planDigest:plan.planDigest, predictedArtifactPaths:plan.artifactPaths, comparison, comparisonDigest:comparison.replayDigest, unsupportedInputChanges:plan.unsupportedInputChanges, observationOnly:true, affectsEligibility:false });
}
