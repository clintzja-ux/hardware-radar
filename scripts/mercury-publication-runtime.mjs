import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ProductRepository, RetailerRepository } from "../packages/atlas/index.js";
import { adapterRegistry, CurrentMarketObservationQualificationService, FileObservationAcceptanceRepository, FileProductionFreshnessPolicyRepository, FilePublicationAuthorizationRepository, FilePublicationDecisionRepository, FileReviewDecisionRepository, Mercury, PublicationOperatorAssessmentService, PublicationWorkflowService } from "../packages/mercury/index.js";
export const parsePublicationArgs = values => new Map(values.map(value => { const index = value.indexOf("="); return index < 0 ? [value, true] : [value.slice(0, index), value.slice(index + 1)]; }));
export function assertPublicationArgs(args, allowed) { for (const key of args.keys()) if (!allowed.includes(key)) throw new Error(`UNSUPPORTED_PUBLICATION_OPERATOR_ARGUMENT:${key}`); }
export function createPublicationOperatorRuntime(args) {
  const location = (name, fallback) => path.resolve(String(args.get(name) || fallback)), readJson = async resource => JSON.parse(await readFile(resource instanceof URL ? fileURLToPath(resource) : resource, "utf8"));
  const acceptanceRepository = new FileObservationAcceptanceRepository({ statePath: location("--observation-state", ".forge-review/mercury/canonical-observations.json"), environment: "production" });
  const reviewRepository = new FileReviewDecisionRepository({ statePath: location("--review-state", ".forge-review/mercury/review-decisions.json"), acceptanceRepository, environment: "production" });
  const publicationRepository = new FilePublicationDecisionRepository({ statePath: location("--publication-state", ".forge-review/mercury/publication-decisions.json"), acceptanceRepository, reviewRepository, environment: "production" });
  const mercury = new Mercury(), productRepository = new ProductRepository({ readJson }), retailerRepository = new RetailerRepository({ readJson });
  const currentMarketQualificationService = new CurrentMarketObservationQualificationService({ acceptanceRepository, reviewRepository, productRepository, retailerRepository, mercury, adapterRegistry, freshnessPolicyRepository: new FileProductionFreshnessPolicyRepository({ statePath: location("--freshness-policy-state", "packages/mercury/current-market/policies/production-policies.json") }) });
  const publicationWorkflowService = new PublicationWorkflowService({ acceptanceRepository, reviewRepository, publicationRepository, mercury, atlas: { getProduct: id => productRepository.getById(id), getRetailer: id => retailerRepository.getById(id) }, currentMarketQualificationService, requireCurrentMarketQualification: true });
  return { assessmentService: new PublicationOperatorAssessmentService({ acceptanceRepository, reviewRepository, publicationRepository, currentMarketQualificationService }), authorizationRepository: new FilePublicationAuthorizationRepository({ statePath: location("--publication-authorization-state", ".forge-review/mercury/publication-authorizations.json") }), publicationWorkflowService };
}
