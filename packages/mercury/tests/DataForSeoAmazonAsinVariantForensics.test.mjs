import assert from "node:assert/strict";
import { assessAtlasAmazonAsinIdentity, AMAZON_ASIN_IDENTITY_STATES } from "../index.js";

let cases = 0;
const atlas = { identity: { atlasProductId: "ram_fixture", manufacturerPartNumber: "CMH32GX5M2B6000C38", brand: "Corsair" }, extension: { data: { capacity: { capacityGb: 32, moduleCount: 2 }, classification: { memoryType: "DDR5", formFactor: "DIMM" }, performance: { dataRateMtps: 6000, primaryTimings: "38-44-44-96" }, physical: { color: "Black", rgbLighting: true } } } };
const exact = (asin = "B0CQQVNCB6", extra = {}) => ({ dataAsin: asin, title: "CORSAIR Vengeance RGB DDR5 RAM 32GB (2x16GB) 6000MHz CL38 Black (CMH32GX5M2B6000C38)", brand: "Corsair", details: { capacityGb: 32, moduleCount: 2, memoryType: "DDR5", formFactor: "DIMM", dataRateMtps: 6000, primaryTimings: "38-44-44-96", color: "Black", rgbLighting: true }, ...extra });
const assess = candidates => assessAtlasAmazonAsinIdentity({ atlasProduct: atlas, candidates, brandAliases: ["Corsair"], corroboratingDestinationAsins: ["B0CQQVNCB6"] });

for (const unrelated of [
  { dataAsin: "B0UNREL001", title: "CORSAIR Vengeance RGB 64GB CMH64GX5M2N6400C32W", details: { capacityGb: 64 } },
  { dataAsin: "B0UNREL002", title: "CORSAIR Vengeance RGB 32GB CMH32GX5M2B6000C40" },
  { dataAsin: "B0UNREL003", title: "G.SKILL Flare X5 64GB F5-6000J2836G32GX2-FX5", brand: "G.SKILL", details: { capacityGb: 64 } },
  { dataAsin: "B0UNREL004", title: "Crucial Pro 32GB CP2K16G60C36U5B", brand: "Crucial" }
]) { const result = assess([exact(), unrelated]); assert.equal(result.state, AMAZON_ASIN_IDENTITY_STATES.STRONG_UNIQUE_ASIN); assert.equal(result.providerAnchor.asin, "B0CQQVNCB6"); cases++; }

assert.equal(assess([exact()]).state, AMAZON_ASIN_IDENTITY_STATES.STRONG_UNIQUE_ASIN); cases++;
assert.equal(assess([exact("B0CQQVNCB6"), exact("B0EXACT002")]).state, AMAZON_ASIN_IDENTITY_STATES.MULTIPLE_COMPATIBLE_ASINS); cases++;
for (const relation of [{ parentAsin: "B0PARENT01" }, { productAsins: [{ dataAsin: "B0MODIFY01" }] }]) { const result = assess([exact(), exact("B0CONFLT01", { ...relation, details: { ...exact().details, capacityGb: 64 } })]); assert.equal(result.state, AMAZON_ASIN_IDENTITY_STATES.ASIN_VARIANT_CONFLICT); cases++; }
for (const changed of [{ title: `${exact().title} bundle with motherboard` }, { condition: "renewed" }, { condition: "used" }]) { const result = assess([{ ...exact(), ...changed }]); assert.equal(result.state, changed.title ? AMAZON_ASIN_IDENTITY_STATES.BUNDLE_ASIN : AMAZON_ASIN_IDENTITY_STATES.RENEWED_OR_USED_ASIN); cases++; }

const neutral = [exact(), { dataAsin: "B0UNREL005", title: "G.SKILL 64GB F5-6000J2836G32GX2-FX5", brand: "G.SKILL", details: { capacityGb: 64 }, price: 1, rank: 1 }];
const forward = assess(neutral), reversed = assess([...neutral].reverse());
assert.equal(forward.assessmentId, reversed.assessmentId); assert.equal(forward.state, AMAZON_ASIN_IDENTITY_STATES.STRONG_UNIQUE_ASIN); assert.equal(forward.priceConsidered, false); assert.equal(forward.sellerConsidered, false); cases++;
const destinationNeutral = assessAtlasAmazonAsinIdentity({ atlasProduct: atlas, candidates: [exact("B0OTHER001")], corroboratingDestinationAsins: ["B0CQQVNCB6"] });
assert.equal(destinationNeutral.providerAnchor.asin, "B0OTHER001"); cases++;
assert.equal(forward.networkOperation, "NONE"); assert.equal(forward.paidTaskCreated, false); assert.equal(forward.actualSpendUsd, 0); assert.equal("historicalEligible" in forward, false); assert.equal("publicationAuthority" in forward, false); cases++;

console.log(`DataForSEO Amazon ASIN variant forensics tests passed: ${cases} cases.`);
