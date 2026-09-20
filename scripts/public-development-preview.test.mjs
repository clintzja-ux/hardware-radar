import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = await mkdtemp(path.join(os.tmpdir(), "hardware-radar-development-preview-"));
const asOf = "2026-09-19T23:52:04.726Z";

try {
    const build = spawnSync(process.execPath, ["scripts/build-public-development-preview.mjs"], {
        cwd: root,
        encoding: "utf8",
        env: {
            ...process.env,
            HARDWARE_RADAR_DEVELOPMENT_PREVIEW_OUTPUT: output,
            HARDWARE_RADAR_DEVELOPMENT_PREVIEW_AT: asOf
        }
    });
    assert.equal(build.status, 0, build.stderr || build.stdout);

    const readJson = async (relativePath) => JSON.parse(await readFile(path.join(output, relativePath), "utf8"));
    const catalog = await readJson("data/ram-catalog.json");
    const currentRetail = await readJson("data/ram-current-retail.json");
    const marker = await readJson("development-preview.json");
    const target = catalog.products.find((product) => product.atlasProductId === "ram_corsair_cmh32gx5m2b6000c38");

    assert.ok(target, "The canonical S2 product must remain in the public catalog projection.");
    assert.equal(catalog.productCount, 103);
    assert.equal(marker.mode, "DEVELOPMENT_PREVIEW");
    assert.equal(marker.productionPublication, false);
    assert.equal(marker.releaseAuthority, false);
    assert.equal(marker.deploymentAuthority, false);
    assert.equal(marker.asOf, asOf);

    const projected = currentRetail.products.find((product) => product.atlasProductId === target.atlasProductId);
    assert.ok(projected, "The canonical governed S2 snapshot must be visible in development preview.");
    assert.deepEqual(projected.offers.map((offer) => [offer.retailerName, offer.itemPriceUsd]), [
        ["Newegg", 569.99],
        ["Amazon", 587.09]
    ]);
    assert.equal(projected.lowerCurrentItemPrice.retailerName, "Newegg");
    assert.equal(projected.lowerCurrentItemPrice.itemPriceUsd, 569.99);

    const targetHtml = await readFile(path.join(output, target.publicPath.slice(1), "index.html"), "utf8");
    assert.match(targetHtml, /Current tracked prices/);
    assert.match(targetHtml, /Lower current item price:[\s\S]*?Newegg — \$569\.99 USD/);
    assert.match(targetHtml, /Amazon/);
    assert.match(targetHtml, /\$587\.09/);
    assert.match(targetHtml, /Newegg/);
    assert.match(targetHtml, /\$569\.99/);
    assert.match(targetHtml, /Prices shown exclude applicable shipping, taxes, and fees/);
    assert.doesNotMatch(targetHtml, /final checkout total|delivered total|condition unknown|seller unknown/i);

    const unrelated = catalog.products.find((product) => product.atlasProductId !== target.atlasProductId);
    const unrelatedHtml = await readFile(path.join(output, unrelated.publicPath.slice(1), "index.html"), "utf8");
    assert.doesNotMatch(unrelatedHtml, /\$569\.99|\$587\.09/);
} finally {
    await rm(output, { recursive: true, force: true });
}

console.log("Explicit governed public development preview contract passed.");
