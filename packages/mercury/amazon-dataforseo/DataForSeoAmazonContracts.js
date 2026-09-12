export const DATAFORSEO_AMAZON_SOURCE_ID = "DATAFORSEO_AMAZON";
export const DATAFORSEO_AMAZON_OPERATIONS = Object.freeze({ PRODUCTS: "AMAZON_PRODUCTS", ASIN: "AMAZON_ASIN", SELLERS: "AMAZON_SELLERS" });

const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const text = value => typeof value === "string" && value.trim() ? value.trim() : null;
const money = value => value == null ? null : Number.isFinite(value) && value >= 0 ? value : (() => { throw new TypeError("DATAFORSEO_AMAZON_MONEY_INVALID"); })();
const asin = value => { const result = text(value); if (!result || !/^[A-Z0-9]{10}$/.test(result.toUpperCase())) throw new TypeError("DATAFORSEO_AMAZON_ASIN_INVALID"); return result.toUpperCase(); };

export function createAmazonProductsEvidence(input = {}) {
  return freeze({ operation: DATAFORSEO_AMAZON_OPERATIONS.PRODUCTS, sourceId: DATAFORSEO_AMAZON_SOURCE_ID, dataAsin: asin(input.data_asin ?? input.dataAsin), title: text(input.title), url: text(input.url), priceRange: input.price_range == null ? null : structuredClone(input.price_range), currency: text(input.currency), delivery: input.delivery == null ? null : structuredClone(input.delivery), specialOffers: input.special_offers == null ? null : structuredClone(input.special_offers) });
}

export function createAmazonAsinEvidence(input = {}) {
  const dataAsin = asin(input.data_asin ?? input.dataAsin);
  return freeze({ operation: DATAFORSEO_AMAZON_OPERATIONS.ASIN, sourceId: DATAFORSEO_AMAZON_SOURCE_ID, dataAsin, parentAsin: input.parent_asin == null ? null : asin(input.parent_asin), productAsins: Array.isArray(input.product_asins) ? input.product_asins.map(value => typeof value === "string" ? { dataAsin: asin(value) } : { ...structuredClone(value), dataAsin: asin(value.data_asin ?? value.dataAsin) }) : [], brand: text(input.brand ?? input.author), title: text(input.title), details: input.details == null ? null : structuredClone(input.details), priceRange: input.price_range == null ? null : structuredClone(input.price_range), currency: text(input.currency) });
}

export function createAmazonSellersEvidence(input = {}) {
  return freeze({ operation: DATAFORSEO_AMAZON_OPERATIONS.SELLERS, sourceId: DATAFORSEO_AMAZON_SOURCE_ID, dataAsin: asin(input.data_asin ?? input.asin ?? input.dataAsin), sellerName: text(input.seller_name), sellerUrl: text(input.seller_url), shipsFrom: text(input.ships_from), condition: text(input.condition), conditionDescription: text(input.condition_description), currentPrice: money(input.price ?? input.current_price), regularPrice: money(input.regular_price), currency: text(input.currency), voucherTerms: input.applicable_vouchers == null ? null : structuredClone(input.applicable_vouchers), sellerRating: input.seller_rating == null ? null : structuredClone(input.seller_rating), delivery: input.delivery == null ? null : structuredClone(input.delivery), deliveryPrice: money(input.delivery_price) });
}

export function projectAmazonSellerToRetainedEvidence(evidence, { atlasProductId = null, sourceTaskId = null, observedAt = null, rawPayloadReference = null } = {}) {
  if (evidence?.operation !== DATAFORSEO_AMAZON_OPERATIONS.SELLERS || evidence?.sourceId !== DATAFORSEO_AMAZON_SOURCE_ID) throw new TypeError("DATAFORSEO_AMAZON_SELLERS_EVIDENCE_REQUIRED");
  return freeze({ provider: "DATAFORSEO", source: DATAFORSEO_AMAZON_SOURCE_ID, sourceMethod: "API", atlasProductId, providerIdentity: { asin: evidence.dataAsin }, seller: { name: evidence.sellerName, url: evidence.sellerUrl, shipsFrom: evidence.shipsFrom }, pricing: { basePrice: evidence.currentPrice, regularPrice: evidence.regularPrice, shippingPrice: evidence.deliveryPrice, tax: null, currency: evidence.currency }, offer: { condition: evidence.condition, conditionDescription: evidence.conditionDescription, availability: null, delivery: evidence.delivery, voucherTerms: evidence.voucherTerms }, provenance: { sourceTaskId, observedAt, rawPayloadReference } });
}
