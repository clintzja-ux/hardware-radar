export function createAtlasTemplate() {
    return {
        id: "",
        category: "",
        subcategory: "",
        brandId: "",
        series: null,
        name: "",
        model: "",
        manufacturerPartNumber: "",
        status: "active",

        specifications: {},

        compatibility: {},

        features: [],

        bestFor: [],

        officialProductUrl: null,

        releaseDate: null,

        metadata: {
            createdAt: "",
            updatedAt: "",
            dataConfidence: "medium",
            sourceReferences: [],
            notes: null
        }
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

        shipping: {
            costKnown: false,
            cost: null,
            currency: null,
            notes: null
        },

        discount: null,

        affiliate: {
            isAffiliateLink: false,
            network: null,
            trackingCodePresent: false
        },

        sourceUrl: "",

        verification: {
            status: "verified",
            method: "manual",
            verifiedAt: "",
            verifiedBy: "Mirabelle Labs",
            notes: null
        },

        metadata: {
            createdAt: "",
            updatedAt: "",
            notes: null
        }
    };
}