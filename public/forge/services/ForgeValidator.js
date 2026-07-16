export class ForgeValidator {
    validateInput(input) {
        const errors = [];
        const warnings = [];

        if (!input.manufacturerUrl) {
            errors.push("Manufacturer URL is required.");
        }

        if (!input.retailerUrl) {
            errors.push("Retailer URL is required.");
        }

        if (!input.brandId) {
            errors.push("Brand is required.");
        }

        if (!input.manufacturerPartNumber) {
            errors.push("Manufacturer part number is required.");
        }

        if (!input.productName) {
            errors.push("Product name is required.");
        }

        if (!Number.isFinite(input.price) || input.price <= 0) {
            errors.push("Price must be greater than zero.");
        }

        if (input.sellerType === "unknown") {
            warnings.push("Seller type has not been classified.");
        }

        if (input.availability === "unknown") {
            warnings.push("Availability is unknown.");
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
}