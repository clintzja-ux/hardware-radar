import brandRepository from "./BrandRepository.js";
import categoryRepository from "./CategoryRepository.js";
import productRepository from "./ProductRepository.js";
import retailerRepository from "./RetailerRepository.js";
import { validateManifest } from "./ManifestValidator.js";

class Atlas {
    constructor({
        brands = brandRepository,
        categories = categoryRepository,
        products = productRepository,
        retailers = retailerRepository
    } = {}) {
        this.brands = brands;
        this.categories = categories;
        this.products = products;
        this.retailers = retailers;
    }

    async getProduct(productId) {
        return this.products.getById(productId);
    }

    async getBrand(brandId) {
        return this.brands.getById(brandId);
    }

    async getCategory(categoryId) {
        return this.categories.getById(categoryId);
    }

    async getRetailer(retailerId) {
        return this.retailers.getById(retailerId);
    }

    async getManifest() {
        return this.products.getManifest();
    }

    async validateManifest() {
        return validateManifest(await this.getManifest());
    }

    async loadRepositories() {
        const [brands, categories, products, retailers] = await Promise.all([
            this.brands.getAll(),
            this.categories.getAll(),
            this.products.getAll(),
            this.retailers.getAll()
        ]);

        return Object.freeze({ brands, categories, products, retailers });
    }

    clearCaches() {
        this.brands.clearCache();
        this.categories.clearCache();
        this.products.clearCache();
        this.retailers.clearCache();
    }
}

export { Atlas };
export default new Atlas();
