import { loadProduct } from "./ProductRepository.js";

class Atlas {

    async getProduct(productId) {
        return await loadProduct(productId);
    }

}

export default new Atlas();