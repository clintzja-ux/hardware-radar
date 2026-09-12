import assert from "node:assert/strict";
import { classifyDefaultAcquisitionRoute, resolveDataForSeoProductCandidates, scoreDataForSeoProductCandidate } from "../index.js";

function atlas(mpn = "ABC123") {
  return {
    identity: { atlasProductId: `ram_fixture_${mpn.toLowerCase().replaceAll("-", "_")}`, brand: mpn.startsWith("CM") ? "Corsair" : "Fixture", manufacturerPartNumber: mpn },
    extension: { data: { classification: { memoryType: "DDR5" }, capacity: { capacityGb: 16, moduleCount: 2, capacityPerModuleGb: 8 }, performance: { dataRateMtps: 5200, casLatency: 40 }, physical: {} } }
  };
}

function scored(title, mpn = "ABC123", dataDocId = "doc") {
  return scoreDataForSeoProductCandidate({ atlasProduct: atlas(mpn), item: { title, data_docid: dataDocId } });
}

assert.equal(scored("Fixture DDR5 ABC123 16GB 2x8GB 5200 CL40").exactMpnMatch, true);
assert.equal(scored("Fixture DDR5 abc123 16GB 2x8GB 5200 CL40").exactMpnMatch, true);
assert.equal(scored("Fixture DDR5 (ABC123), 16GB 2x8GB 5200 CL40").exactMpnMatch, true);
assert.equal(scored("Fixture DDR5 ABC123W 16GB 2x8GB 5200 CL40").exactMpnMatch, false);
assert.equal(scored("Fixture DDR5 XABC123 16GB 2x8GB 5200 CL40").exactMpnMatch, false);
assert.equal(scored("Fixture DDR5 ABC123-ALT 16GB 2x8GB 5200 CL40").exactMpnMatch, false);

const corsairMpn = "CMH16GX5M2B5200Z40";
const suffix = scored("Corsair DDR5 CMH16GX5M2B5200Z40W 16GB 2x8GB 5200 CL40", corsairMpn, "suffix");
assert.equal(suffix.exactMpnMatch, false);
assert.ok(suffix.contradictions.includes("DIFFERENT_MPN:CMH16GX5M2B5200Z40W"));
assert.equal(suffix.outcome, "REJECTED");
assert.equal(suffix.exactMpnMatch && suffix.contradictions.some(value => value.startsWith("DIFFERENT_MPN:")), false);

const cleanTitle = `Corsair ${corsairMpn} Vengeance RGB DDR5 16GB 2x8GB 5200 CL40`;
const unique = resolveDataForSeoProductCandidates({ atlasProduct: atlas(corsairMpn), items: [
  { title: cleanTitle, data_docid: "clean" },
  { title: cleanTitle.replace(corsairMpn, `${corsairMpn}W`), data_docid: "suffix-variant" }
] });
assert.equal(unique.recommendationStatus, "RECOMMENDED");
assert.equal(unique.recommendedCandidate.item.dataDocId, "clean");
assert.equal(classifyDefaultAcquisitionRoute({ resolution: unique, directSellersLineageCertified: true }).executableRoute, "READY_FOR_SELLERS");

const multiple = resolveDataForSeoProductCandidates({ atlasProduct: atlas(corsairMpn), items: ["a", "b", "c"].map(data_docid => ({ title: cleanTitle, data_docid })) });
assert.equal(multiple.recommendationStatus, "AMBIGUOUS");
const multipleRoute = classifyDefaultAcquisitionRoute({ resolution: multiple, directSellersLineageCertified: true });
assert.equal(multipleRoute.materialIdentity, "AMBIGUOUS");
assert.equal(multipleRoute.executableRoute, "MANUAL_PROVIDER_SELECTION");

const rejectedSubstring = { ...multiple.candidates[0], outcome: "REJECTED", contradictions: ["DIFFERENT_MPN:ABC123W"] };
const isolated = classifyDefaultAcquisitionRoute({
  resolution: { recommendationStatus: "RECOMMENDED", recommendedCandidate: multiple.candidates[1], candidates: [multiple.candidates[1], rejectedSubstring] },
  directSellersLineageCertified: true
});
assert.equal(isolated.materialIdentity, "ESTABLISHED");
assert.equal(isolated.executableRoute, "READY_FOR_SELLERS");

const liveReplay = resolveDataForSeoProductCandidates({ atlasProduct: atlas(corsairMpn), items: [
  { title: "Corsair Vengeance 16GB (2x8GB) RAM DDR5 5200MHz CMH16GX5M2B5200Z40", data_docid: "11576802757176384012" },
  { title: "Corsair Vengeance RGB CMH16GX5M2B5200Z40 DDR5 16GB 2x8GB 5200 CL40", data_docid: "5327259357682777702" },
  { title: "Corsair Vengeance RGB DDR5 16GB 2x8GB 5200 CL40 CMH16GX5M2B5200Z40", data_docid: "83202910179076809" },
  { title: "Corsair Vengeance RGB CMH16GX5M2B5200Z40W DDR5 16GB 2x8GB 5200 CL40", data_docid: "13939921956259571079", product_id: "8464555073041761941" }
] });
assert.equal(liveReplay.candidates.find(value => value.item.dataDocId === "13939921956259571079").exactMpnMatch, false);
assert.equal(liveReplay.candidates.filter(value => value.exactMpnMatch && value.outcome === "RECOMMENDED").length, 3);
const liveRoute = classifyDefaultAcquisitionRoute({ resolution: liveReplay, directSellersLineageCertified: true });
assert.equal(liveRoute.materialIdentity, "AMBIGUOUS");
assert.equal(liveRoute.executableRoute, "MANUAL_PROVIDER_SELECTION");
assert.equal(liveRoute.reasons.includes("MATERIAL_IDENTITY_CONTRADICTION"), false);

console.log("Exact MPN boundary correction tests passed (20 cases).");
