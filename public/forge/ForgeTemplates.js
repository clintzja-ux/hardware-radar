/**
 * ForgeTemplates
 *
 * Canonical templates used by Forge when generating
 * Atlas and Mercury records.
 */

export function createAtlasTemplate() {

    return {

        id: "",

        category: "",

        subcategory: "",

        brandId: "",

        series: "",

        name: "",

        model: "",

        manufacturerPartNumber: "",

        status: "active",

        specifications: {},

        compatibility: {},

        features: [],

        bestFor: [],

        officialProductUrl: "",

        releaseDate: null,

        metadata: {}

    };

}

export function createMercuryTemplate() {

    return {

        id: "",

        productId: "",

        retailerId: "",

        observedAt: "",

        price: null,

        currency: "USD",

        availability: "unknown",

        condition: "new",

        sellerType: "unknown",

        shipping: {},

        discount: null,

        affiliate: {},

        sourceUrl: "",

        verification: {},

        metadata: {}

    };

}