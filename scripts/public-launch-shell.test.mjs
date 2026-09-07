import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "public");
const readPublic = (relativePath) => readFile(path.join(publicRoot, relativePath), "utf8");

const categoryPages = ["ddr5.html", "ddr4.html", "sodimm.html"];
const categoryModules = [
    "js/modules/pages/ddr5.js",
    "js/modules/pages/ddr4.js",
    "js/modules/pages/sodimm.js"
];

const pageIdentity = new Map([
    ["index.html", ["Compare RAM Prices | Hardware Radar", "Compare RAM Prices", "https://cheapestram.com/"]],
    ["ddr5.html", ["Compare DDR5 RAM Prices | Hardware Radar", "Compare DDR5 RAM Prices", "https://cheapestram.com/ddr5.html"]],
    ["ddr4.html", ["Compare DDR4 RAM Prices | Hardware Radar", "Compare DDR4 RAM Prices", "https://cheapestram.com/ddr4.html"]],
    ["sodimm.html", ["Compare Laptop RAM Prices | Hardware Radar", "Compare Laptop RAM Prices", "https://cheapestram.com/sodimm.html"]],
    ["about.html", ["About Hardware Radar", "About Hardware Radar", "https://cheapestram.com/about.html"]],
    ["how-we-choose.html", ["How We Compare RAM Prices | Hardware Radar", "How We Choose", "https://cheapestram.com/how-we-choose.html"]],
    ["contact.html", ["Contact | Hardware Radar", "Contact", "https://cheapestram.com/contact.html"]],
    ["affiliate-disclosure.html", ["Affiliate Disclosure | Hardware Radar", "Affiliate Disclosure", "https://cheapestram.com/affiliate-disclosure.html"]],
    ["privacy-policy.html", ["Privacy Policy | Hardware Radar", "Privacy Policy", "https://cheapestram.com/privacy-policy.html"]],
    ["terms.html", ["Terms of Use | Hardware Radar", "Terms of Use", "https://cheapestram.com/terms.html"]]
]);

for (const [file, [title, heading, url]] of pageIdentity) {
    const source = await readPublic(file);
    assert.match(source, new RegExp(`<title>${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</title>`));
    assert.match(source, new RegExp(`<h1>${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</h1>`));
    assert.match(source, new RegExp(`<link rel="canonical" href="${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`));
    assert.match(source, new RegExp(`property="og:url"[\\s\\S]{0,80}content="${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    assert.equal((source.match(/<main(?:\s|>)/g) ?? []).length, 1, `${file} must contain one main landmark.`);
    assert.equal((source.match(/<\/main>/g) ?? []).length, 1, `${file} must close its main landmark.`);
    assert.equal((source.match(/<section(?:\s|>)/g) ?? []).length, (source.match(/<\/section>/g) ?? []).length, `${file} section markup must be balanced.`);
    if (/<h3>/.test(source)) assert.match(source, /<h2>/, `${file} must not skip directly from h1 to h3.`);
    assert.doesNotMatch(source, /Controller\s*$/);
}

for (const obsoletePath of [
    "data/ram.json",
    "data/ram/ddr5.json",
    "data/ram/ddr4.json",
    "data/ram/sodimm.json",
    "js/modules/data.js",
    "js/modules/renderDecisionPaths.js"
]) {
    await assert.rejects(access(path.join(publicRoot, obsoletePath)), { code: "ENOENT" });
}

const loader = await readPublic("js/modules/loadCategory.js");
assert.match(loader, /loadCurrentRetailSnapshot\(\)/);
assert.doesNotMatch(loader, /fetch\(path\)/);
assert.match(loader, /Unsupported governed market scope/);
assert.match(loader, /winnerToDisplayProduct/);

for (const file of categoryModules) {
    assert.doesNotMatch(await readPublic(file), /data\/ram\//);
}

for (const file of [...categoryPages, ...categoryModules]) {
    const source = await readPublic(file);
    assert.doesNotMatch(source, /Gaming Pick|RGB Pick|Workstation Pick|Upgrade Pick|Business Pick|href=["']#["']/i);
}

for (const file of categoryPages) {
    const source = await readPublic(file);
    assert.equal((source.match(/<main(?:\s|>)/g) ?? []).length, 1, `${file} must contain one main landmark.`);
    assert.match(source, /aria-live="polite"/);
}

for (const file of categoryModules) {
    const source = await readPublic(file);
    assert.match(source, /catch \(error\)/);
    assert.match(source, /renderRecommendationError/);
    assert.match(source, /renderExpandableComparison\(\[\]/);
}

const productionCopy = await Promise.all([
    "index.html",
    ...categoryPages,
    "how-we-choose.html",
    "js/modules/renderTrust.js",
    "js/modules/renderOverall.js",
    "js/modules/renderCategory.js",
    "js/modules/renderFooter.js"
].map(readPublic));
for (const source of productionCopy) {
    assert.doesNotMatch(source, /updated throughout the day|prices verified throughout the day|today['’]s best verified|next-lowest verified/i);
    assert.doesNotMatch(source, /cheapest (?:on )?(?:the )?(?:entire )?internet|cheapest everywhere|market-wide cheapest|final delivered price/i);
}

const homepage = await readPublic("index.html");
assert.match(homepage, /<h1>Compare RAM Prices<\/h1>/);
assert.match(homepage, /Find the cheapest RAM from the retailers we track\./);
assert.match(homepage, /Compare current RAM prices across DDR5, DDR4 and laptop memory\./);
assert.equal((homepage.match(/id="(?:ddr5|ddr4|sodimm)Section"/g) ?? []).length, 3);
assert.doesNotMatch(homepage, /eccSection|Server\s*\/\s*ECC/i);

const homepageRuntime = await readPublic("js/main.js");
assert.match(homepageRuntime, /Cheapest RAM Today/);
assert.match(homepageRuntime, /Cheapest DDR5 Today/);
assert.match(homepageRuntime, /Cheapest DDR4 Today/);
assert.match(homepageRuntime, /Cheapest Laptop RAM Today/);
assert.doesNotMatch(homepageRuntime, /eccSection|Server\s*\/\s*ECC/i);

const containers = new Map();
globalThis.document = {
    getElementById(id) {
        if (!containers.has(id)) containers.set(id, { innerHTML: "", setAttribute() {} });
        return containers.get(id);
    }
};
const { renderRecommendation } = await import(pathToFileURL(path.join(publicRoot, "js/modules/renderRecommendation.js")));
renderRecommendation({
    brand: "Example",
    model: "RAM",
    bestFor: "Fixture",
    capacity: "32GB",
    memoryType: "DDR5",
    speed: "6000 MT/s",
    price: "99.00",
    retailer: "Retailer",
    priceBasis: "Listed price",
    shippingMessage: "Shipping not verified",
    insight: "Fixture",
    offerUrl: "https://retailer.example/item"
}, "recommendation");
assert.match(containers.get("recommendation").innerHTML, /target="_blank"/);
assert.match(containers.get("recommendation").innerHTML, /rel="noopener noreferrer"/);
assert.match(containers.get("recommendation").innerHTML, /Prices shown exclude applicable shipping, taxes, and fees\./);
assert.match(containers.get("recommendation").innerHTML, /CHEAPEST CURRENT ITEM PRICE/);

const { renderOverallUnavailable } = await import(pathToFileURL(path.join(publicRoot, "js/modules/renderOverall.js")));
const { winnerToDisplayProduct } = await import(pathToFileURL(path.join(publicRoot, "js/modules/marketData.js")));
const publicOffer = { atlasProductId: "ram_one", brand: "Example", family: "Winner", displayName: "Example Winner", totalCapacityGb: 32, moduleCount: 2, capacityPerModuleGb: 16, ddrGeneration: "DDR5", formFactor: "DIMM", speedMtps: 6000, itemPriceUsd: 99, currency: "USD", retailerId: "RETAILER-0001", retailerName: "Retailer A", destinationUrl: "https://retailer.example/a", observedAt: "2026-08-31T12:00:00Z", comparisonSemantics: "ITEM_PRICE" };
const projected = winnerToDisplayProduct({ winners: { ddr5: publicOffer }, products: [{ offers: [publicOffer] }] }, "ddr5", "ddr5", "Cheapest DDR5 Today");
renderOverallUnavailable("overallSection");
assert.match(containers.get("overallSection").innerHTML, /No tracked RAM price is available right now/);
assert.match(containers.get("overallSection").innerHTML, /stay hidden rather than being replaced with estimates/);
assert.doesNotMatch(containers.get("overallSection").innerHTML, /publication requirements|governed candidates|E2S/i);
const { renderOverall } = await import(pathToFileURL(path.join(publicRoot, "js/modules/renderOverall.js")));
renderOverall([{ ...projected, section: "overall" }]);
assert.match(containers.get("overallSection").innerHTML, /CHEAPEST RAM TODAY/);
assert.match(containers.get("overallSection").innerHTML, /Prices shown exclude applicable shipping, taxes, and fees\./);
assert.match(containers.get("overallSection").innerHTML, /Price checked/);

const { renderCategoryUnavailable } = await import(pathToFileURL(path.join(publicRoot, "js/modules/renderCategory.js")));
renderCategoryUnavailable("ddr5Section", "Cheapest DDR5 we're tracking");
assert.match(containers.get("ddr5Section").innerHTML, /Price unavailable right now/);
assert.match(containers.get("ddr5Section").innerHTML, /Check again later/);
const { renderCategory } = await import(pathToFileURL(path.join(publicRoot, "js/modules/renderCategory.js")));
renderCategory([{ ...projected, section: "ddr5", title: "Cheapest DDR5 Today" }], "ddr5", "ddr5Section", "Browse DDR5 RAM");
assert.match(containers.get("ddr5Section").innerHTML, /Cheapest DDR5 Today/);
assert.match(containers.get("ddr5Section").innerHTML, /Price checked/);

assert.equal(projected.price, "99.00");
assert.equal(projected.shippingMessage, "Shipping, taxes and fees excluded");
assert.equal(projected.comparisonSemantics, "ITEM_PRICE");
assert.equal(winnerToDisplayProduct({ winners: { ddr5: null }, products: [] }, "ddr5", "ddr5", "DDR5"), null);
const comparisonSource = await readPublic("js/modules/renderExpandableComparison.js");
assert.match(comparisonSource, /shippingMessage/);
assert.match(comparisonSource, /target="_blank" rel="noopener noreferrer"/);
assert.match(comparisonSource, /type="button" class="comparison-toggle" aria-expanded="false" aria-controls=/);
assert.match(comparisonSource, /class="comparison-content" id="\$\{contentId\}" hidden/);
assert.match(comparisonSource, /setAttribute\("aria-expanded", String\(!isOpen\)\)/);
assert.match(comparisonSource, /aria-label="View \$\{product\.brand\} \$\{product\.model\} at \$\{product\.retailer\}"/);

const styles = await readPublic("css/styles.css");
assert.match(styles, /\.comparison-toggle:focus-visible/);
assert.match(styles, /@media\(max-width:600px\)[\s\S]*?\.comparison-item\{[\s\S]*?flex-direction:column/);
assert.match(styles, /\.comparison-item a\{[\s\S]*?min-height:44px/);
assert.match(styles, /\.category-grid\{[\s\S]*?grid-template-columns:repeat\(3,1fr\)/);

const methodology = await readPublic("how-we-choose.html");
assert.match(methodology, /lowest qualifying listed price within its monitored coverage/);
assert.match(methodology, /may not include shipping, tax, or other mandatory charges/);
assert.match(methodology, /Affiliate relationships do not determine/i);

for (const file of ["about.html", "how-we-choose.html", "affiliate-disclosure.html", "terms.html"]) {
    assert.doesNotMatch(await readPublic(file), /recommendation|verified pricing|today['’]s best/i);
}

const contact = await readPublic("contact.html");
assert.match(contact, /human correspondence, including outbound retailer outreach/);
assert.match(contact, /Inbound delivery remains a separate launch QA check/);

const privacy = await readPublic("privacy-policy.html");
assert.match(privacy, /Google Analytics/);
assert.match(privacy, /Microsoft Clarity/);

const marketSnapshot = JSON.parse(await readPublic("data/market-snapshot.json"));
for (const scope of ["overall", "ddr5", "ddr4", "sodimm"]) {
    assert.equal(marketSnapshot.scopes[scope].status, "INSUFFICIENT_DATA");
    assert.equal(marketSnapshot.scopes[scope].cheapest, null);
    assert.deepEqual(marketSnapshot.scopes[scope].alternatives, []);
}
const currentRetail = JSON.parse(await readPublic("data/ram-current-retail.json"));
assert.equal(currentRetail.comparisonSemantics, "ITEM_PRICE");
assert.equal(currentRetail.disclosure, "Prices shown exclude applicable shipping, taxes, and fees.");
assert.doesNotMatch(JSON.stringify(currentRetail), /\.forge-review|operatorNotes|workbook/i);

console.log("Public launch-shell truth and safety contract passed.");
