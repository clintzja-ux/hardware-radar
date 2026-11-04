import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createPricePublicationGeneratedPathInventory } from "./lib/publication-generated-path-inventory.mjs";
import { DEFAULT_LIVE_PRICE_GENERATED_PATHS } from "../packages/sentinel/publication/GovernedLivePricePublication.js";

const packageJson=JSON.parse(await readFile(new URL("../package.json",import.meta.url),"utf8"));
assert.equal(packageJson.scripts["build:public:price-publication"],"node scripts/build-public.mjs --scope=PRICE_PUBLICATION");
assert.equal(packageJson.scripts["verify:public:price-publication"],"node scripts/verify-public-build.mjs --scope=PRICE_PUBLICATION");
const build=await readFile(new URL("./build-public.mjs",import.meta.url),"utf8"),factory=await readFile(new URL("../packages/sentinel/publication/ProductionUnattendedPublicationFactory.js",import.meta.url),"utf8"),rehearsal=await readFile(new URL("./publication-three-root-rehearsal.mjs",import.meta.url),"utf8");
assert.match(build,/buildScope === "PRICE_PUBLICATION"/);assert.match(build,/if \(!pricePublication\)/);assert.match(factory,/build:public:price-publication/);assert.match(rehearsal,/newegg-routine-task\.ps1/);assert.match(rehearsal,/createPortableNpmRunner/);assert.match(rehearsal,/checkoutRoot/);
const good=createPricePublicationGeneratedPathInventory({changedPaths:["config/publication-release.json","public/data/ram-current-retail.json","public/ram/example/index.html"],authorizedPaths:DEFAULT_LIVE_PRICE_GENERATED_PATHS});assert.equal(good.valid,true);
const forge=createPricePublicationGeneratedPathInventory({changedPaths:["public/forge/app.js"],authorizedPaths:DEFAULT_LIVE_PRICE_GENERATED_PATHS});assert.equal(forge.valid,false);assert.deepEqual(forge.applicationPackagingPaths,["public/forge/app.js"]);
const atlas=createPricePublicationGeneratedPathInventory({changedPaths:["public/data/atlas/index.js"],authorizedPaths:DEFAULT_LIVE_PRICE_GENERATED_PATHS});assert.equal(atlas.valid,false);
const source=createPricePublicationGeneratedPathInventory({changedPaths:["scripts/build-public.mjs"],authorizedPaths:DEFAULT_LIVE_PRICE_GENERATED_PATHS});assert.equal(source.valid,false);assert.deepEqual(source.unauthorizedPaths,["scripts/build-public.mjs"]);
console.log("Publication Reliability P1 contract tests passed: registered price-only build, three-root composition, allowlist, and application-packaging exclusion.");
