import crypto from "node:crypto";

export const AMAZON_ASIN_IDENTITY_POLICY_VERSION = "MERCURY-HISTORY-046-1.0";
export const AMAZON_ASIN_IDENTITY_STATES = Object.freeze({ STRONG_UNIQUE_ASIN: "STRONG_UNIQUE_ASIN", MULTIPLE_COMPATIBLE_ASINS: "MULTIPLE_COMPATIBLE_ASINS", ASIN_VARIANT_CONFLICT: "ASIN_VARIANT_CONFLICT", ASIN_NOT_FOUND: "ASIN_NOT_FOUND", BUNDLE_ASIN: "BUNDLE_ASIN", RENEWED_OR_USED_ASIN: "RENEWED_OR_USED_ASIN", INSUFFICIENT_ASIN_EVIDENCE: "INSUFFICIENT_ASIN_EVIDENCE" });
const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
const digest = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const norm = value => String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exactMpnToken = (value, mpn) => Boolean(mpn) && new RegExp(`(?<![A-Z0-9-])${escapeRegExp(String(mpn).toUpperCase())}(?![A-Z0-9-])`).test(String(value ?? "").toUpperCase());
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const explicit = (candidate, key) => candidate?.details?.[key] ?? candidate?.[key] ?? null;

function assessCandidate(atlasProduct, candidate, aliases) {
  const identity = atlasProduct.identity ?? {}, data = atlasProduct.extension?.data ?? {}, title = String(candidate?.title ?? "");
  const expectedMpn = norm(identity.manufacturerPartNumber), exactMpn = exactMpnToken(`${title} ${candidate?.manufacturerPartNumber ?? ""}`, identity.manufacturerPartNumber);
  const acceptedBrands = [identity.brand, ...(aliases ?? [])].map(norm).filter(Boolean), observedBrand = norm(candidate?.brand);
  const contradictions = [];
  const compare = (field, expected, actual) => { if (actual != null && expected != null && norm(actual) !== norm(expected)) contradictions.push(`${field}_CONFLICT`); };
  if (observedBrand && !acceptedBrands.includes(observedBrand)) contradictions.push("BRAND_CONFLICT");
  compare("CAPACITY", data.capacity?.capacityGb, explicit(candidate, "capacityGb"));
  compare("MODULE_COUNT", data.capacity?.moduleCount, explicit(candidate, "moduleCount"));
  compare("MEMORY_TYPE", data.classification?.memoryType, explicit(candidate, "memoryType"));
  compare("FORM_FACTOR", data.classification?.formFactor, explicit(candidate, "formFactor"));
  compare("SPEED", data.performance?.dataRateMtps, explicit(candidate, "dataRateMtps"));
  compare("TIMINGS", data.performance?.primaryTimings, explicit(candidate, "primaryTimings"));
  compare("COLOR", data.physical?.color, explicit(candidate, "color"));
  compare("RGB", data.physical?.rgbLighting, explicit(candidate, "rgbLighting"));
  const capacities=[...title.matchAll(/\b(8|16|24|32|48|64|96|128)\s*GB\b/gi)].map(match=>Number(match[1]));
  if(capacities.length&&data.capacity?.capacityGb!=null&&!capacities.includes(Number(data.capacity.capacityGb)))contradictions.push("CAPACITY_CONFLICT");
  if(/\bDDR[45]\b/i.test(title)&&!new RegExp(`\\b${String(data.classification?.memoryType??"")}\\b`,"i").test(title))contradictions.push("MEMORY_TYPE_CONFLICT");
  const condition = norm(candidate?.condition ?? candidate?.conditionDescription), renewed = /RENEWED|USED|REFURBISHED|OPENBOX|PREOWNED/.test(condition) || /\b(RENEWED|USED|REFURBISHED|OPEN[ -]?BOX|PRE[ -]?OWNED)\b/i.test(title);
  const bundle = candidate?.bundle === true || /\b(BUNDLE|COMBO|WITH (?:CPU|PROCESSOR|MOTHERBOARD))\b/i.test(title);
  const asin = String(candidate?.dataAsin ?? candidate?.data_asin ?? "").toUpperCase();
  return { asin, exactMpn: Boolean(exactMpn), contradictions, renewed, bundle, compatible: /^[A-Z0-9]{10}$/.test(asin) && exactMpn && contradictions.length === 0 && !renewed && !bundle, evidence: { exactMpn: Boolean(exactMpn), brand: observedBrand || null, parentAsin: candidate?.parentAsin ?? candidate?.parent_asin ?? null, productAsins: structuredClone(candidate?.productAsins ?? candidate?.product_asins ?? []) } };
}

export function assessAtlasAmazonAsinIdentity({ atlasProduct, candidates, brandAliases = [], corroboratingDestinationAsins = [] } = {}) {
  if (!atlasProduct?.identity?.atlasProductId || !Array.isArray(candidates)) throw new TypeError("AMAZON_ASIN_IDENTITY_INPUT_INVALID");
  const assessed = candidates.map(candidate => assessCandidate(atlasProduct, candidate, brandAliases)).sort((a, b) => a.asin.localeCompare(b.asin));
  const exactCandidates = assessed.filter(value => value.exactMpn);
  const compatible = [...new Map(exactCandidates.filter(value => value.compatible).map(value => [value.asin, value])).values()];
  let state, reasons;
  if (!assessed.length) [state, reasons] = [AMAZON_ASIN_IDENTITY_STATES.ASIN_NOT_FOUND, ["ASIN_NOT_FOUND"]];
  else if (exactCandidates.some(value => value.bundle)) [state, reasons] = [AMAZON_ASIN_IDENTITY_STATES.BUNDLE_ASIN, ["BUNDLE_ASIN_NOT_STANDALONE"]];
  else if (exactCandidates.some(value => value.renewed)) [state, reasons] = [AMAZON_ASIN_IDENTITY_STATES.RENEWED_OR_USED_ASIN, ["RENEWED_OR_USED_IDENTITY_DISTINCT"]];
  else if (exactCandidates.some(value => value.contradictions.length)) [state, reasons] = [AMAZON_ASIN_IDENTITY_STATES.ASIN_VARIANT_CONFLICT, [...new Set(exactCandidates.flatMap(value => value.contradictions))].sort()];
  else if (compatible.length > 1) [state, reasons] = [AMAZON_ASIN_IDENTITY_STATES.MULTIPLE_COMPATIBLE_ASINS, ["MULTIPLE_CONTRADICTION_FREE_ASINS"]];
  else if (compatible.length === 1) [state, reasons] = [AMAZON_ASIN_IDENTITY_STATES.STRONG_UNIQUE_ASIN, ["EXACT_MPN_CONTRADICTION_FREE_UNIQUE_ASIN"]];
  else [state, reasons] = [AMAZON_ASIN_IDENTITY_STATES.INSUFFICIENT_ASIN_EVIDENCE, ["EXACT_MPN_EVIDENCE_MISSING"]];
  const material = { policyVersion: AMAZON_ASIN_IDENTITY_POLICY_VERSION, atlasProductId: atlasProduct.identity.atlasProductId, state, reasons, providerAnchor: state === AMAZON_ASIN_IDENTITY_STATES.STRONG_UNIQUE_ASIN ? { asin: compatible[0].asin, identityClass: "DOCUMENTED_AMAZON_PRODUCT_IDENTITY" } : null, candidates: assessed, corroboratingDestinationAsins: [...new Set(corroboratingDestinationAsins)].sort(), priceConsidered: false, sellerConsidered: false };
  return freeze({ schemaVersion: "1.0", assessmentId: `mer_amzasin_${digest(material).slice(0, 24)}`, ...material, providerAnchorEligible: state === AMAZON_ASIN_IDENTITY_STATES.STRONG_UNIQUE_ASIN, networkOperation: "NONE", paidTaskCreated: false, actualSpendUsd: 0 });
}
