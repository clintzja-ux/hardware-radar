export class RequiredFieldValidator {
    validate(input) {
        const errors = [];

        if (!input.manufacturerUrl) {
            errors.push(
                "Manufacturer URL is required."
            );
        }

        if (!input.retailerUrl) {
            errors.push(
                "Retailer URL is required."
            );
        }

        if (!input.brandId) {
            errors.push(
                "Brand is required."
            );
        }

        if (!input.manufacturerPartNumber) {
            errors.push(
                "Manufacturer part number is required."
            );
        }

        if (!input.productName) {
            errors.push(
                "Product name is required."
            );
        }

        if (
            !Number.isFinite(input.price) ||
            input.price <= 0
        ) {
            errors.push(
                "Price must be greater than zero."
            );
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}