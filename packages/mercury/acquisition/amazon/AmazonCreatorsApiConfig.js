export const AMAZON_CREATORS_API_BASE_URL = "https://creatorsapi.amazon";
export const AMAZON_US_MARKETPLACE = "www.amazon.com";
export const AMAZON_US_RESOURCES = Object.freeze([
  "offersV2.listings.price",
  "offersV2.listings.availability",
  "offersV2.listings.condition",
  "offersV2.listings.merchantInfo"
]);
export function validateAmazonCreatorsConfig(config = {}) {
  const errors = [];
  for (const k of ["partnerTag", "credentialVersion"]) if (!String(config[k] ?? "").trim()) errors.push(`${k} is required`);
  if (config.marketplace && config.marketplace !== AMAZON_US_MARKETPLACE) errors.push("FM006 supports www.amazon.com only");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
