const normalize = value => String(value).replaceAll("\\", "/").replace(/^\.\//, "");

export const PRICE_PUBLICATION_APPLICATION_PACKAGING_PREFIXES = Object.freeze([
  "public/forge/",
  "public/data/atlas/",
  "public/guides/",
  "public/js/",
  "public/css/"
]);

const allowed = (file, allowlist) => allowlist.some(entry => entry.endsWith("/") ? file.startsWith(entry) : file === entry);

export function createPricePublicationGeneratedPathInventory({ changedPaths = [], authorizedPaths = [] } = {}) {
  const paths = [...new Set(changedPaths.map(normalize))].sort();
  const applicationPackagingPaths = paths.filter(file => PRICE_PUBLICATION_APPLICATION_PACKAGING_PREFIXES.some(prefix => file.startsWith(prefix)));
  const unauthorizedPaths = paths.filter(file => !allowed(file, authorizedPaths));
  return Object.freeze({
    schemaVersion: "1.0",
    scope: "PRICE_PUBLICATION",
    paths: Object.freeze(paths),
    pathCount: paths.length,
    unauthorizedPaths: Object.freeze(unauthorizedPaths),
    applicationPackagingPaths: Object.freeze(applicationPackagingPaths),
    valid: unauthorizedPaths.length === 0 && applicationPackagingPaths.length === 0
  });
}
