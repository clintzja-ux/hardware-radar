import assert from "node:assert/strict";
import { BrandRepository } from "../BrandRepository.js";
import { CategoryRepository } from "../CategoryRepository.js";
import { ProductRepository } from "../ProductRepository.js";
import { RetailerRepository } from "../RetailerRepository.js";

const requiredMethods = [
    "getManifest",
    "load",
    "getAll",
    "getById",
    "exists",
    "search",
    "validate",
    "reload",
    "clearCache"
];

for (const Repository of [BrandRepository, CategoryRepository, ProductRepository, RetailerRepository]) {
    const repository = new Repository({ readJson: async () => ({ products: [], brands: [], categories: [], retailers: [] }) });
    for (const method of requiredMethods) {
        assert.equal(typeof repository[method], "function", `${Repository.name} must implement ${method}().`);
    }
}

console.log("Repository contract tests passed.");
