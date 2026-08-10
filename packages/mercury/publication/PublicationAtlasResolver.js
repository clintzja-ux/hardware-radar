export class PublicationAtlasResolver {
  constructor({ products = [], retailers = [] } = {}) {
    this.products = new Map(products.map((product) => [product?.identity?.atlasProductId, product]));
    this.retailers = new Map(retailers.map((retailer) => [retailer?.id, retailer]));
  }
  async getProduct(atlasProductId) { return this.products.get(atlasProductId) ?? null; }
  async getRetailer(retailerId) { return this.retailers.get(retailerId) ?? null; }
}
export default PublicationAtlasResolver;
