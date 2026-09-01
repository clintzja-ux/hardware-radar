import { readFile } from "node:fs/promises";
import path from "node:path";
import { ProductRepository, RetailerRepository } from "../packages/atlas/index.js";
import { classifyObservationStorage, CuratedRamOfferAssessmentService, FileCuratedRamOfferAuthorizationRepository, FileObservationAcceptanceRepository, SourceRightsRegistry } from "../packages/mercury/index.js";
export const parseCuratedArgs = values => new Map(values.map(value => { const index = value.indexOf("="); return index < 0 ? [value, true] : [value.slice(0, index), value.slice(index + 1)]; }));
export function assertCuratedArgs(args, allowed) { for (const key of args.keys()) if (!allowed.includes(key)) throw new Error(`UNSUPPORTED_CURATED_RAM_ARGUMENT:${key}`); }
async function read(resource, fallback = null) { try { return JSON.parse(await readFile(resource, "utf8")); } catch (error) { if (error?.code === "ENOENT" && fallback !== null) return fallback; throw error; } }
export async function createCuratedRuntime(args) {
  const location = (name, fallback) => path.resolve(String(args.get(name) || fallback)), readJson = resource => read(resource);
  const rightsState = await read(location("--rights-state", ".forge-review/mercury/curated-source-rights.json"), {}), rightsRegistry = new SourceRightsRegistry({ sourceProfiles: rightsState.profiles ?? rightsState });
  const productRepository = new ProductRepository({ readJson }), retailerRepository = new RetailerRepository({ readJson }), acceptanceRepository = new FileObservationAcceptanceRepository({ statePath: location("--observation-state", ".forge-review/mercury/canonical-observations.json"), environment: "production", retentionPolicy: observation => classifyObservationStorage(observation, { registry: rightsRegistry }) }), authorizationRepository = new FileCuratedRamOfferAuthorizationRepository({ statePath: location("--curated-authorization-state", ".forge-review/mercury/curated-offer-authorizations.json") }), assessmentService = new CuratedRamOfferAssessmentService({ productRepository, retailerRepository, rightsRegistry });
  return { assessmentService, authorizationRepository, acceptanceRepository, productRepository, retailerRepository, rightsRegistry };
}
export const readCuratedCandidate = file => read(path.resolve(file));
