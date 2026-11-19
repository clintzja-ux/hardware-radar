import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRamProductSitemapRoutes } from "./ram-product-publishing.mjs";

const source=JSON.parse(await readFile("packages/atlas/products/ram/ddr5/HR-RAM-DDR5-000036-corsair-vengeance-rgb-cmh16gx5m2b5200z40.json","utf8")),id=source.identity.atlasProductId;
const lastmod=({atlas="2026-11-10T00:00:00.000Z",current=[],history=[]}={})=>createRamProductSitemapRoutes([{...source,identity:{...source.identity,updatedAt:atlas}}],{currentRetailByProduct:new Map([[id,{offers:current.map(observedAt=>({observedAt}))}]]),chronologicalSeriesByProduct:new Map([[id,{timestampGroups:history.map(observedAt=>({observedAt}))}]])})[0].lastmod;

assert.equal(lastmod({atlas:"2026-11-17T00:00:00.000Z",current:["2026-11-01T12:00:00.000Z"]}),"2026-11-17");
assert.equal(lastmod({current:["2026-11-18T12:00:00.000Z"]}),"2026-11-18");
assert.equal(lastmod({current:["2026-11-12T12:00:00.000Z"],history:["2026-11-19T12:00:00.000Z"]}),"2026-11-19");
assert.equal(lastmod({atlas:"2026-11-18T01:00:00.000Z",current:["2026-11-18T23:00:00.000Z"],history:["2026-11-18T12:00:00.000Z"]}),"2026-11-18");
assert.equal(lastmod({current:["invalid"],history:["also-invalid"]}),"2026-11-10");
assert.equal(lastmod({current:["2026-11-18T12:00:00.000Z"]}),lastmod({current:["2026-11-18T12:00:00.000Z"]}));
console.log("RAM product lastmod maximum-evidence contract passed: Atlas, Current, History, same-day, invalid-date, deterministic cases.");
