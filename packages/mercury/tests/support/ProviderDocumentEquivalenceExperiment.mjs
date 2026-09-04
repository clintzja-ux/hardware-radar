const normalize = value => String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const firstNumber = (text, patterns) => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
};

function titleEvidence(title, atlasProduct, item = {}) {
  const text = String(title ?? '');
  const upper = text.toUpperCase();
  const data = atlasProduct.extension?.data ?? {};
  const suppliedBrand = item.brand ?? item.providerBrand ?? null;
  const moduleMatch = upper.match(/\b(\d+)\s*[X×]\s*(\d+)\s*GB\b/);
  const formFactor = /\bSO[- ]?DIMM\b/.test(upper) ? 'SODIMM'
    : /\b(?:U[- ]?DIMM|DIMM)\b/.test(upper) ? 'DIMM' : null;
  const moduleType = /\bU[- ]?DIMM\b/.test(upper) ? 'UDIMM' : null;
  const condition = /\bOPEN[- ]?BOX\b/.test(upper) ? 'OPEN_BOX'
    : /\bREFURB(?:ISHED)?\b/.test(upper) ? 'REFURBISHED'
      : /\bUSED\b/.test(upper) ? 'USED'
        : /\bNEW\b/.test(upper) ? 'NEW' : null;
  const color = /\bBLACK\b/.test(upper) ? 'BLACK'
    : /\bWHITE\b/.test(upper) ? 'WHITE'
      : /\bGR(?:A|E)Y\b/.test(upper) ? 'GREY' : null;
  return {
    mpn: normalize(atlasProduct.identity?.manufacturerPartNumber) && normalize(text).includes(normalize(atlasProduct.identity.manufacturerPartNumber))
      ? normalize(atlasProduct.identity.manufacturerPartNumber) : null,
    brand: suppliedBrand ? normalize(suppliedBrand)
      : normalize(text).includes(normalize(atlasProduct.identity?.brand)) ? normalize(atlasProduct.identity.brand) : null,
    memoryType: /\bDDR5\b/.test(upper) ? 'DDR5' : /\bDDR4\b/.test(upper) ? 'DDR4' : null,
    capacityGb: firstNumber(upper, [/\b(\d+)\s*GB\b/]),
    moduleCount: moduleMatch ? Number(moduleMatch[1]) : null,
    capacityPerModuleGb: moduleMatch ? Number(moduleMatch[2]) : null,
    formFactor,
    moduleType,
    dataRateMtps: firstNumber(upper, [/\bDDR[45][-_ ]?(\d{4,5})\b/, /\b(\d{4,5})\s*(?:MHZ|MT\/S|MTPS)\b/]),
    casLatency: firstNumber(upper, [/\bCL\s*(\d{1,3})\b/]),
    rgb: /\bRGB\b/.test(upper) ? true : null,
    color,
    condition,
    bundle: /\b(?:BUNDLE|COMBO|WITH\s+(?:COOLER|MOTHERBOARD|CPU))\b/.test(upper) ? true : null,
    replacement: /\b(?:REPLACEMENT\s+FOR|COMPATIBLE\s+WITH|REPLACEMENT-COMPATIBLE)\b/.test(upper)
  };
}

const atlasEvidence = atlasProduct => {
  const data = atlasProduct.extension?.data ?? {};
  return {
    mpn: normalize(atlasProduct.identity?.manufacturerPartNumber),
    brand: normalize(atlasProduct.identity?.brand),
    memoryType: data.classification?.memoryType ?? null,
    capacityGb: data.capacity?.capacityGb ?? null,
    moduleCount: data.capacity?.moduleCount ?? null,
    capacityPerModuleGb: data.capacity?.capacityPerModuleGb ?? null,
    formFactor: data.classification?.formFactor ?? null,
    moduleType: data.classification?.moduleType ?? null,
    dataRateMtps: data.performance?.dataRateMtps ?? null,
    casLatency: data.performance?.casLatency ?? null,
    rgb: data.physical?.rgbLighting ?? null,
    color: data.physical?.color ?? null
  };
};

const significantFields = [
  'mpn', 'brand', 'memoryType', 'capacityGb', 'moduleCount', 'capacityPerModuleGb',
  'formFactor', 'moduleType', 'dataRateMtps', 'casLatency', 'rgb', 'color', 'condition', 'bundle'
];

export function assessPotentialProviderDocumentEquivalenceCandidate({ atlasProduct, candidate, minimumScore = 78 } = {}) {
  if (!atlasProduct?.identity || !candidate?.item) throw new TypeError('Atlas product and scored candidate are required.');
  const evidence = titleEvidence(candidate.item.title, atlasProduct, candidate.item);
  const atlas = atlasEvidence(atlasProduct);
  const reasons = [];
  if (!candidate.exactMpnMatch || evidence.mpn !== atlas.mpn) reasons.push('EXACT_NORMALIZED_MPN_REQUIRED');
  if (!Number.isFinite(candidate.score) || candidate.score < minimumScore) reasons.push('RECOMMENDATION_THRESHOLD_NOT_MET');
  if (candidate.contradictions?.length) reasons.push(...candidate.contradictions.map(value => `RESOLVER_CONTRADICTION:${value}`));
  if (evidence.replacement) reasons.push('REPLACEMENT_OR_COMPATIBILITY_MERCHANDISE');
  if (evidence.bundle) reasons.push('BUNDLE_OR_CONDITIONAL_VARIANT');
  if (evidence.condition && evidence.condition !== 'NEW') reasons.push(`CONDITION_CONFLICT:${evidence.condition}`);
  for (const field of Object.keys(atlas)) {
    if (evidence[field] != null && atlas[field] != null && evidence[field] !== atlas[field]) reasons.push(`ATLAS_FIELD_CONTRADICTION:${field}`);
  }
  return Object.freeze({ eligible: reasons.length === 0, reasons: Object.freeze(reasons), evidence: Object.freeze(evidence), candidate });
}

function jointlyCompatible(left, right) {
  const disagreements = significantFields.filter(field => left.evidence[field] != null && right.evidence[field] != null && left.evidence[field] !== right.evidence[field]);
  return { compatible: disagreements.length === 0, disagreements };
}

export function assessPotentialProviderDocumentEquivalenceGroups({ atlasProduct, candidates, minimumScore = 78 } = {}) {
  if (!Array.isArray(candidates)) throw new TypeError('Candidates are required.');
  const assessed = candidates.map(candidate => assessPotentialProviderDocumentEquivalenceCandidate({ atlasProduct, candidate, minimumScore }));
  const groups = [];
  for (const member of assessed.filter(value => value.eligible)) {
    const group = groups.find(existing => existing.every(prior => jointlyCompatible(prior, member).compatible));
    if (group) group.push(member); else groups.push([member]);
  }
  return Object.freeze({
    groups: Object.freeze(groups.map(group => Object.freeze(group))),
    excluded: Object.freeze(assessed.filter(value => !value.eligible)),
    assessed: Object.freeze(assessed)
  });
}
