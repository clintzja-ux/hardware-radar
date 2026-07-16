export class ForgeIdGenerator {
    generateProductId(category, subcategory, number) {
        const normalizedCategory = this.normalizeSegment(category);
        const normalizedSubcategory = this.normalizeSegment(subcategory);
        const sequence = String(number).padStart(6, "0");

        return `HR-${normalizedCategory}-${normalizedSubcategory}-${sequence}`;
    }

    generatePriceObservationId(date, number) {
        const normalizedDate = date.replaceAll("-", "");
        const sequence = String(number).padStart(6, "0");

        return `PRICE-${normalizedDate}-${sequence}`;
    }

    normalizeSegment(value) {
        return String(value)
            .trim()
            .toUpperCase()
            .replaceAll(/[^A-Z0-9]+/g, "");
    }
}