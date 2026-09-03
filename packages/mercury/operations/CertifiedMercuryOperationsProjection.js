const validDate=value=>typeof value==="string"&&Number.isFinite(Date.parse(value));
const object=value=>value&&typeof value==="object"&&!Array.isArray(value);
const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const clone=value=>structuredClone(value);

function requireArray(value,code){if(!Array.isArray(value))throw new TypeError(code);return value;}
function productId(product){return product?.identity?.atlasProductId;}
function evidenceProductId(record){return record?.candidate?.identity?.atlasProductId;}
function unique(values,code){const set=new Set(values);if(set.size!==values.length)throw new Error(code);return set;}

/**
 * Compose certified, already-derived Mercury/Atlas state for read-only Forge use.
 * This boundary deliberately does not evaluate identity, promotion, cadence,
 * review, publication, freshness, or acquisition policy.
 */
export function createCertifiedMercuryOperationsProjection(input={}){
 if(!object(input)||!validDate(input.asOf))throw new TypeError("CERTIFIED_MERCURY_OPERATIONS_INPUT_INVALID");
 const atlasProducts=requireArray(input.atlasProducts,"CERTIFIED_MERCURY_ATLAS_SOURCE_INVALID");
 const evidenceRecords=requireArray(input.evidenceRecords,"CERTIFIED_MERCURY_EVIDENCE_SOURCE_INVALID");
 const identityProjections=requireArray(input.identityProjections,"CERTIFIED_MERCURY_IDENTITY_SOURCE_INVALID");
 const promotionAssessments=requireArray(input.promotionAssessments,"CERTIFIED_MERCURY_PROMOTION_SOURCE_INVALID");
 const canonicalObservations=requireArray(input.canonicalObservations??[],"CERTIFIED_MERCURY_OBSERVATION_SOURCE_INVALID");
 const reviewDecisions=requireArray(input.effectiveReviewDecisions??[],"CERTIFIED_MERCURY_REVIEW_SOURCE_INVALID");
 const publicationDecisions=requireArray(input.effectivePublicationDecisions??[],"CERTIFIED_MERCURY_PUBLICATION_SOURCE_INVALID");
 const portfolio=input.historicalPortfolio;
 if(!object(portfolio)||portfolio.schemaVersion!=="1.0"||portfolio.readModelType!=="HISTORICAL_OBSERVATION_PORTFOLIO"||portfolio.asOf!==input.asOf||!Array.isArray(portfolio.products)||!object(portfolio.summary))throw new Error("CERTIFIED_MERCURY_PORTFOLIO_SOURCE_INVALID");

 const atlasIds=atlasProducts.map(productId);if(atlasIds.some(id=>typeof id!=="string"||!id))throw new Error("CERTIFIED_MERCURY_ATLAS_SOURCE_INVALID");unique(atlasIds,"CERTIFIED_MERCURY_ATLAS_ID_CONFLICT");
 const portfolioIds=portfolio.products.map(x=>x?.atlasProductId);if(portfolioIds.some(id=>!atlasIds.includes(id))||unique(portfolioIds,"CERTIFIED_MERCURY_PORTFOLIO_ID_CONFLICT").size!==atlasIds.length)throw new Error("CERTIFIED_MERCURY_PORTFOLIO_BINDING_INVALID");
 for(const record of evidenceRecords)if(!object(record)||typeof record.evidenceId!=="string"||!atlasIds.includes(evidenceProductId(record)))throw new Error("CERTIFIED_MERCURY_EVIDENCE_SOURCE_INVALID");
 unique(evidenceRecords.map(x=>x.evidenceId),"CERTIFIED_MERCURY_EVIDENCE_ID_CONFLICT");
 for(const projection of identityProjections){const evidence=evidenceRecords.find(x=>x.evidenceId===projection?.evidenceId);if(!object(projection)||projection.projectionVersion!=="1.0"||!evidence||!object(projection.product)||!object(projection.merchant)||projection.product.atlasProductId!==evidenceProductId(evidence))throw new Error("CERTIFIED_MERCURY_IDENTITY_SOURCE_INVALID");}
 unique(identityProjections.map(x=>x.evidenceId),"CERTIFIED_MERCURY_IDENTITY_ID_CONFLICT");
 for(const assessment of promotionAssessments)if(!object(assessment)||assessment.assessmentVersion!=="1.0"||typeof assessment.atlasProductId!=="string"||!atlasIds.includes(assessment.atlasProductId)||!Array.isArray(assessment.reasons)||typeof assessment.state!=="string")throw new Error("CERTIFIED_MERCURY_PROMOTION_SOURCE_INVALID");
 unique(promotionAssessments.map(x=>x.atlasProductId),"CERTIFIED_MERCURY_PROMOTION_ID_CONFLICT");
 const observationIds=canonicalObservations.map(x=>x?.observationId);if(observationIds.some(x=>typeof x!=="string")||canonicalObservations.some(x=>!atlasIds.includes(x.atlasProductId)))throw new Error("CERTIFIED_MERCURY_OBSERVATION_SOURCE_INVALID");unique(observationIds,"CERTIFIED_MERCURY_OBSERVATION_ID_CONFLICT");
 for(const decision of reviewDecisions)if(!object(decision)||typeof decision.observationId!=="string"||!observationIds.includes(decision.observationId)||typeof decision.decision!=="string")throw new Error("CERTIFIED_MERCURY_REVIEW_SOURCE_INVALID");
 for(const decision of publicationDecisions)if(!object(decision)||typeof decision.observationId!=="string"||!observationIds.includes(decision.observationId)||typeof decision.action!=="string")throw new Error("CERTIFIED_MERCURY_PUBLICATION_SOURCE_INVALID");
 unique(reviewDecisions.map(x=>x.observationId),"CERTIFIED_MERCURY_REVIEW_STATE_CONFLICT");unique(publicationDecisions.map(x=>x.observationId),"CERTIFIED_MERCURY_PUBLICATION_STATE_CONFLICT");

 const products=[...atlasProducts].sort((a,b)=>productId(a)<productId(b)?-1:productId(a)>productId(b)?1:0).map(product=>{
  const atlasProductId=productId(product),portfolioEntry=portfolio.products.find(x=>x.atlasProductId===atlasProductId),evidence=evidenceRecords.filter(x=>evidenceProductId(x)===atlasProductId),identities=identityProjections.filter(x=>x.product.atlasProductId===atlasProductId),promotion=promotionAssessments.find(x=>x.atlasProductId===atlasProductId)??null,observations=canonicalObservations.filter(x=>x.atlasProductId===atlasProductId);
  const workflows=observations.map(observation=>{const review=reviewDecisions.find(x=>x.observationId===observation.observationId)??null,publication=publicationDecisions.find(x=>x.observationId===observation.observationId)??null;return {observationId:observation.observationId,review:review?{state:review.decision,decisionId:review.reviewDecisionId??null}: {state:"NOT_REVIEWED",decisionId:null},publication:publication?{state:publication.action,decisionId:publication.publicationDecisionId??null}:{state:"NOT_DECIDED",decisionId:null}};});
  const promotionReasons=promotion?.reasons?.map(reason=>clone(reason))??[],blockers=[...promotionReasons.map(reason=>({...reason,source:"PROMOTION_ASSESSMENT"})),...(portfolioEntry.cycle.blockingReasons??[]).map(code=>({source:"HISTORICAL_PORTFOLIO",code,dimension:"cycle",detail:null}))];
  return {atlasProduct:{atlasProductId,displayName:product.identity?.displayName??null,brand:product.identity?.brand??null,manufacturerPartNumber:product.identity?.manufacturerPartNumber??null,productType:product.identity?.productType??null},evidence:{retainedCount:evidence.length,evidenceIds:evidence.map(x=>x.evidenceId).sort()},history:{...clone(portfolioEntry.history),valueSemantics:"HISTORICAL_OBSERVATION",currentPrice:false,livePrice:false,publicPrice:false},identityReview:{state:identities.length?"AVAILABLE":"NOT_AVAILABLE",evidenceProjections:clone(identities)},promotion:promotion?clone(promotion):{state:"NOT_ASSESSED",historicalEligible:false,canonicalEligible:false,publicationEligible:false,reasons:[]},cadence:clone(portfolioEntry.cadence),cycle:clone(portfolioEntry.cycle),durableWorkflow:{state:workflows.length?"AVAILABLE":"NOT_AVAILABLE",observations:workflows},blockers,nextAction:portfolioEntry.cycle.nextAction??null};
 });
 return freeze({schemaVersion:"1.0",projectionType:"CERTIFIED_MERCURY_OPERATIONS_PROJECTION",asOf:input.asOf,semantics:{canonicalOperationalView:true,legacyPreview:false,historicalValueSemantics:"HISTORICAL_OBSERVATION",currentPrice:false,livePrice:false,publicPrice:false,publicationAuthority:false},summary:{...clone(portfolio.summary),retainedEvidenceCount:evidenceRecords.length},products,readOnly:true,actionExecuted:false,mutationAuthorized:false,networkOperation:"NONE",paidTaskCreated:false,actualSpendUsd:0});
}

export default createCertifiedMercuryOperationsProjection;
