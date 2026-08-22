function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${field} must be an object.`);
  return value;
}
function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${field} must be a non-empty string.`);
  return value.trim();
}
function assertZeroCost(result, field) {
  const cost = Number(result?.cost ?? 0);
  if (!Number.isFinite(cost) || cost !== 0) throw new Error(`${field}_RETRIEVAL_MUST_BE_ZERO_COST`);
}
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}

/**
 * Adapt already-paid DataForSEO SELLERS + PRODUCT_INFO results into the
 * certified DF003 result processor. This service never creates provider tasks.
 */
export class SellersResultDf003RetentionService {
  constructor({ resultProcessor } = {}) {
    if (!resultProcessor?.process) throw new TypeError('resultProcessor is required.');
    this.resultProcessor = resultProcessor;
  }

  async retain({ sellersResult, productInfoResult, sellersTaskId, productInfoTaskId, observedAt, providerIdentity, candidateId = null } = {}) {
    requireObject(sellersResult, 'sellersResult');
    requireObject(productInfoResult, 'productInfoResult');
    const sourceTaskId = requireString(sellersTaskId, 'sellersTaskId');
    requireString(productInfoTaskId, 'productInfoTaskId');
    const timestamp = requireString(observedAt, 'observedAt');
    if (!Number.isFinite(Date.parse(timestamp))) throw new TypeError('observedAt must be an ISO timestamp.');
    requireObject(providerIdentity, 'providerIdentity');
    assertZeroCost(sellersResult, 'SELLERS');
    assertZeroCost(productInfoResult, 'PRODUCT_INFO');

    const sellersBlock = sellersResult?.result?.[0];
    const productInfoItem = productInfoResult?.result?.[0]?.items?.[0];
    if (!sellersBlock) throw new Error('SELLERS_RESULT_BLOCK_MISSING');
    if (!productInfoItem) throw new Error('PRODUCT_INFO_RESULT_ITEM_MISSING');
    const sellers = Array.isArray(sellersBlock.items) ? sellersBlock.items : [];
    if (sellers.length === 0) throw new Error('SELLERS_RESULT_ITEMS_MISSING');

    const expectedDataDocId = providerIdentity.dataDocId ?? null;
    const expectedProductId = providerIdentity.productId ?? null;
    const expectedGid = providerIdentity.gid ?? null;
    const identityMatches =
      (expectedDataDocId && productInfoItem.data_docid === expectedDataDocId) ||
      (expectedProductId && productInfoItem.product_id === expectedProductId) ||
      (expectedGid && productInfoItem.gid === expectedGid);
    if (!identityMatches) throw new Error('DF003_PRODUCT_INFO_IDENTITY_MISMATCH');

    const integrations = [];
    for (const [index, sellerItem] of sellers.entries()) {
      const integration = await this.resultProcessor.process({
        providerResponse: {
          payload: {
            sellerItem,
            productItem: productInfoItem,
            context: {
              sourceTaskId,
              observedAt: timestamp,
              productTitle: sellersBlock.title ?? productInfoItem.title ?? null,
              dataDocId: expectedDataDocId,
              productId: expectedProductId,
              gid: expectedGid,
              rawPayloadReference: `dataforseo:sellers:${sourceTaskId}:item:${index}`
            }
          }
        },
        execution: {
          kind: 'SELLERS_RESULT_RETENTION',
          sellersTaskId: sourceTaskId,
          productInfoTaskId,
          ...providerIdentity
        },
        candidateId: candidateId ?? `retention:${sourceTaskId}:${index}`
      });
      integrations.push(integration);
    }

    return freeze({
      schemaVersion: '1.0',
      operation: 'SELLERS_RESULT_DF003_RETENTION',
      sellersTaskId: sourceTaskId,
      productInfoTaskId,
      sellerItems: sellers.length,
      retained: integrations.filter(x => x.evidenceOutcome === 'RETAINED').length,
      duplicates: integrations.filter(x => x.evidenceOutcome === 'DUPLICATE').length,
      rejected: integrations.filter(x => x.evidenceOutcome === 'REJECTED_INVALID_EVIDENCE').length,
      actualSpendUsd: 0,
      paidTaskCreated: false,
      integrations
    });
  }
}

export default SellersResultDf003RetentionService;
