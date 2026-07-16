export class ForgeIdGenerator {

    generateProductId(category, type, number) {

        return `HR-${category}-${type}-${String(number).padStart(6,"0")}`;

    }

    generatePriceObservationId(date, number){

        return `PRICE-${date}-${String(number).padStart(6,"0")}`;

    }

}