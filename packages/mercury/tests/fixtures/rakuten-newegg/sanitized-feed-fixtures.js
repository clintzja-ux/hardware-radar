export const BASE_FIELD_NAMES = [
    "productId", "productName", "sku", "primaryCategory", "secondaryCategory", "productUrl", "productImageUrl", "buyUrl", "shortDescription", "longDescription", "discount", "discountType", "salePrice", "retailPrice", "beginDate", "endDate", "brand", "shipping", "keywords", "manufacturerPartNumber", "manufacturerName", "shippingInformation", "availability", "upc", "classId", "currency", "m1", "pixel", "attribute1", "attribute2", "attribute3", "attribute4", "attribute5", "attribute6", "attribute7", "attribute8", "attribute9", "attribute10"
];

const defaults = Object.freeze({ productId: "fixture-product-1", productName: "Sanitized RAM fixture", sku: "N82E16820000001", primaryCategory: "Hardware", secondaryCategory: "Electronics Accessories~~Memory~~RAM", productUrl: "https://click.example.invalid/track?murl=https%3A%2F%2Fwww.newegg.com%2Fp%2FN82E16820000001", productImageUrl: "https://images.example.invalid/fixture.jpg", buyUrl: "", shortDescription: "Sanitized fixture", longDescription: "Sanitized fixture only", discount: "0", discountType: "amount", salePrice: "99.99", retailPrice: "99.99", beginDate: "", endDate: "", brand: "Fixture", shipping: "0.00", keywords: "memory", manufacturerPartNumber: "FIXTURE-MPN-1", manufacturerName: "Fixture", shippingInformation: "", availability: "in-stock", upc: "000000000001", classId: "140", currency: "USD", m1: "", pixel: "" });
const quote = value => /[|"\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
export const fixtureRow = (overrides = {}, { delta = true } = {}) => {
    const record = { ...defaults, ...overrides };
    const fields = BASE_FIELD_NAMES.map(name => quote(String(record[name] ?? "")));
    if (delta) fields.push(record.modification ?? "U");
    return fields.join("|");
};
export const fixtureMkplRow = (overrides = {}) => {
    const base = fixtureRow(overrides, { delta: false }).split("|");
    return [...base, ...Array.from({ length: 12 }, (_, index) => `mkpl-${index + 1}`), overrides.modification ?? "U"].join("|");
};
export const fixtureFeedText = ({ rows, timestamp = "2026-09-08T12:00:00.000Z", trailerCount = rows.length,advertiserMid="44583",advertiserName="SANITIZED FIXTURE" } = {}) => [`HDR|${advertiserMid}|${advertiserName}|${timestamp}`, ...rows, `TRL|${trailerCount}`].join("\n");

// Derived only from the operator-observed Rakuten Newegg Product Catalog schema.
// No credential, SFTP identifier, private tracking identifier, or real feed payload is retained.
export const sanitizedCases = Object.freeze({
    ordinary: fixtureRow(),
    insertedRam: fixtureRow({ productId: "fixture-insert", sku: "N82E16820000002", manufacturerPartNumber: "FIXTURE-MPN-2", modification: "I" }),
    updatedRam: fixtureRow({ productId: "fixture-update", modification: "U" }),
    deletedRam: fixtureRow({ productId: "fixture-delete", modification: "D" }),
    missingOptional: fixtureRow({ salePrice: "", shipping: "", upc: "", shortDescription: "" }),
    quotedPipe: fixtureRow({ productName: "Sanitized RAM | quoted field" }),
    mkpl: fixtureMkplRow({ sku: "9SIAFIXTURE01", productUrl: "https://click.example.invalid/track?murl=https%3A%2F%2Fwww.newegg.com%2Fp%2F9SIAFIXTURE01" }),
    jarrods: fixtureRow({ productId: "fixture-additional", productName: "Independent additional-feed fixture" })
});
