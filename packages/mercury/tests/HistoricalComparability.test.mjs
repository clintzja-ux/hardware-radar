import assert from "node:assert/strict"; import { HistoricalIntelligence } from "../HistoricalIntelligence.js";
const mk=(id,currency,condition,retailerId="R1")=>({observationId:id,atlasProductId:"ram_x",retailerId,marketplace:"market",observationTime:`2026-01-0${id.at(-1)}T00:00:00Z`,validationStatus:"PASS",offer:{price:10,currency,condition}});
const h=new HistoricalIntelligence(), rows=[mk("mer_obs_000000001","USD","NEW"),mk("mer_obs_000000002","JMD","NEW"),mk("mer_obs_000000003","USD","USED")];
assert.equal(h.getTimeline(rows,{atlasProductId:"ram_x",currency:"USD",condition:"NEW"}).length,1); assert.equal(h.getTimeline(rows,{atlasProductId:"ram_x",currency:"USD",condition:"USED"}).length,1);
console.log("Historical comparability tests passed.");
