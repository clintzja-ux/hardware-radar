import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { ProductRepository } from '../../atlas/index.js';

const readLocalJson = async (resource) => JSON.parse(await fs.readFile(resource, 'utf8'));
const repository = new ProductRepository({ readJson: readLocalJson });
const product = await repository.loadProduct('ram_corsair_cmk32gx5m2b6000z30');

assert.equal(product.identity.atlasProductId, 'ram_corsair_cmk32gx5m2b6000z30');
assert.equal(product.identity.manufacturerPartNumber, 'CMK32GX5M2B6000Z30');

console.log('Product enrichment CLI Node-local Atlas loading contract passed.');
