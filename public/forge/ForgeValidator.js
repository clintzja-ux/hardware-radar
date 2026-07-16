export class ForgeValidator {

    validateProduct(product){

        const errors = [];

        if(!product.brandId)
            errors.push("Missing brandId.");

        if(!product.manufacturerPartNumber)
            errors.push("Missing manufacturer part number.");

        return errors;

    }

}