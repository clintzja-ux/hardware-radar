import { validateManifest } from "./ManifestValidator.js";

export const ATLAS_INTEGRITY_VALIDATOR_VERSION = "1.0.0";

function issue(code, path, message, details = {}) {
    return Object.freeze({ code, path, message, ...details });
}

function normalize(value) {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function uniqueIndex(records, valuesForRecord, label, errors) {
    const index = new Map();
    records.forEach((record, recordIndex) => {
        for (const rawValue of valuesForRecord(record)) {
            const value = normalize(rawValue);
            if (!value) continue;
            if (index.has(value)) {
                errors.push(issue(
                    "DUPLICATE_REPOSITORY_IDENTITY",
                    `${label}[${recordIndex}]`,
                    `Duplicate ${label}: ${rawValue}.`,
                    { value: rawValue }
                ));
            } else {
                index.set(value, record);
            }
        }
    });
    return index;
}

function validateProductRelationships({ products, brands, categories }, errors) {
    const brandsByName = uniqueIndex(
        brands,
        (brand) => [brand?.displayName, brand?.legalName, ...(Array.isArray(brand?.aliases) ? brand.aliases : [])],
        "brandNameOrAlias",
        errors
    );
    const categoriesByProductType = new Map();

    categories.forEach((category) => {
        for (const productType of category?.productTypes ?? []) {
            const key = normalize(productType);
            if (!key) continue;
            const existing = categoriesByProductType.get(key) ?? [];
            existing.push(category);
            categoriesByProductType.set(key, existing);
        }
    });

    products.forEach((product, index) => {
        const productId = product?.identity?.atlasProductId ?? `products[${index}]`;
        const brandName = product?.identity?.brand;
        const productType = product?.identity?.productType;
        const brand = brandsByName.get(normalize(brandName));
        const matchingCategories = categoriesByProductType.get(normalize(productType)) ?? [];

        if (!brand) {
            errors.push(issue(
                "MISSING_BRAND_REFERENCE",
                `${productId}:identity.brand`,
                `Product brand does not resolve to an Atlas brand: ${brandName ?? "<missing>"}.`,
                { sourceId: productId, targetValue: brandName ?? null }
            ));
        }

        if (matchingCategories.length === 0) {
            errors.push(issue(
                "MISSING_CATEGORY_REFERENCE",
                `${productId}:identity.productType`,
                `Product type does not resolve to an Atlas category: ${productType ?? "<missing>"}.`,
                { sourceId: productId, targetValue: productType ?? null }
            ));
        } else if (matchingCategories.length > 1) {
            errors.push(issue(
                "AMBIGUOUS_CATEGORY_REFERENCE",
                `${productId}:identity.productType`,
                `Product type resolves to multiple Atlas categories: ${productType}.`,
                { sourceId: productId, targetValue: productType }
            ));
        }

        if (brand && matchingCategories.length === 1) {
            const categoryId = matchingCategories[0].categoryId;
            if (!brand.supportedCategories?.includes(categoryId)) {
                errors.push(issue(
                    "UNSUPPORTED_BRAND_CATEGORY",
                    `${productId}:identity.brand`,
                    `${brand.displayName} does not declare support for category ${categoryId}.`,
                    { sourceId: productId, brandId: brand.brandId, categoryId }
                ));
            }
        }
    });
}

function validateCategoryBrandReferences({ brands, categories }, errors) {
    const categoryIds = new Set(categories.map((category) => normalize(category?.categoryId)).filter(Boolean));
    brands.forEach((brand) => {
        for (const categoryId of brand?.supportedCategories ?? []) {
            if (!categoryIds.has(normalize(categoryId))) {
                errors.push(issue(
                    "MISSING_SUPPORTED_CATEGORY_REFERENCE",
                    `${brand?.brandId ?? "unknown"}:supportedCategories`,
                    `Brand references a category that does not exist: ${categoryId}.`,
                    { sourceId: brand?.brandId ?? null, targetValue: categoryId }
                ));
            }
        }
    });
}

export function validateAtlasIntegrity({ manifest, products, brands, categories, retailers }) {
    for (const [name, value] of Object.entries({ products, brands, categories, retailers })) {
        if (!Array.isArray(value)) throw new TypeError(`${name} must be an array.`);
    }

    const errors = [];
    const warnings = [];
    const manifestReport = validateManifest(manifest);
    errors.push(...manifestReport.errors.map((entry) => issue(
        `MANIFEST_${entry.code}`,
        `manifest:${entry.path}`,
        entry.message
    )));

    uniqueIndex(products, (product) => [product?.identity?.atlasProductId], "atlasProductId", errors);
    uniqueIndex(products, (product) => [product?.identity?.slug], "productSlug", errors);
    uniqueIndex(products, (product) => [product?.identity?.manufacturerPartNumber], "manufacturerPartNumber", errors);
    uniqueIndex(brands, (brand) => [brand?.brandId], "brandId", errors);
    uniqueIndex(categories, (category) => [category?.categoryId], "categoryId", errors);
    uniqueIndex(retailers, (retailer) => [retailer?.id], "retailerId", errors);

    validateCategoryBrandReferences({ brands, categories }, errors);
    validateProductRelationships({ products, brands, categories }, errors);

    const counts = Object.freeze({
        products: products.length,
        brands: brands.length,
        categories: categories.length,
        retailers: retailers.length
    });

    return Object.freeze({
        validatorVersion: ATLAS_INTEGRITY_VALIDATOR_VERSION,
        valid: errors.length === 0,
        status: errors.length === 0 ? "PASS" : "FAIL",
        counts,
        brokenReferences: errors.filter((entry) => entry.code.includes("REFERENCE")).length,
        duplicateIdentities: errors.filter((entry) => entry.code === "DUPLICATE_REPOSITORY_IDENTITY").length,
        manifestValid: manifestReport.valid,
        errors: Object.freeze(errors),
        warnings: Object.freeze(warnings)
    });
}

export function formatAtlasHealthReport(report) {
    if (!report || typeof report !== "object") throw new TypeError("report must be an object.");
    const counts = report.counts ?? {};
    return [
        "Atlas Repository Health",
        "=======================",
        "",
        `Brands: ${counts.brands ?? 0}`,
        `Products: ${counts.products ?? 0}`,
        `Categories: ${counts.categories ?? 0}`,
        `Retailers: ${counts.retailers ?? 0}`,
        "",
        `Broken references: ${report.brokenReferences ?? 0}`,
        `Duplicate identities: ${report.duplicateIdentities ?? 0}`,
        `Manifest: ${report.manifestValid ? "PASS" : "FAIL"}`,
        "",
        `Repository Status: ${report.status ?? (report.valid ? "PASS" : "FAIL")}`
    ].join("\n");
}
