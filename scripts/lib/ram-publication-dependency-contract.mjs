export const RAM_PUBLICATION_DEPENDENCIES = Object.freeze({
  ATLAS_SPECIFICATION: Object.freeze(["ATLAS_SOURCE_RECORD", "RAM_CATALOG", "RAM_PRODUCT_PAGE", "SITEMAP"]),
  MERCURY_CURRENT: Object.freeze(["RAM_CURRENT_RETAIL", "RAM_TERMINAL", "RAM_TERMINAL_PAGE", "RAM_PRODUCT_PAGE", "SITEMAP"])
});

export function calculateRamProductLastmod({ atlasModifiedAt = null, currentObservedAt = [], historyObservedAt = [] } = {}) {
  const timestamps = [atlasModifiedAt, ...currentObservedAt, ...historyObservedAt]
    .filter(value => typeof value === "string" && Number.isFinite(Date.parse(value)));
  return new Date(Math.max(...timestamps.map(value => Date.parse(value)))).toISOString().slice(0, 10);
}

export function resolveRamPublicationArtifacts({ changeType, publicPath, atlasSourcePath = null, sitemapLastmodAdvances = true, includeAtlasSourceRecord = true } = {}) {
  const declaredFamilies = RAM_PUBLICATION_DEPENDENCIES[changeType];
  if (!declaredFamilies) throw new Error("PUBLICATION_DEPENDENCY_CHANGE_TYPE_INVALID");
  const artifactFamilies = declaredFamilies.filter(family =>
    (family !== "SITEMAP" || sitemapLastmodAdvances === true) &&
    (family !== "ATLAS_SOURCE_RECORD" || includeAtlasSourceRecord === true)
  );
  const route = String(publicPath ?? "").replace(/^\//, "").replace(/\/$/, "");
  const pathFor = family => {
    if (family === "ATLAS_SOURCE_RECORD") return `public/data/atlas/${String(atlasSourcePath ?? "").replaceAll("\\", "/").replace(/^packages\/atlas\//, "")}`;
    if (family === "RAM_CATALOG") return "public/data/ram-catalog.json";
    if (family === "RAM_CURRENT_RETAIL") return "public/data/ram-current-retail.json";
    if (family === "RAM_TERMINAL") return "public/data/ram-terminal.json";
    if (family === "RAM_TERMINAL_PAGE") return "public/ram/terminal/index.html";
    if (family === "RAM_PRODUCT_PAGE") return `public/${route}/index.html`;
    if (family === "SITEMAP") return "public/sitemap.xml";
    throw new Error("PUBLICATION_DEPENDENCY_ARTIFACT_FAMILY_INVALID");
  };
  return Object.freeze({ artifactFamilies: Object.freeze(artifactFamilies), artifactPaths: Object.freeze(artifactFamilies.map(pathFor)) });
}
