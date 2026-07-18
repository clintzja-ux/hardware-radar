import {
    RequiredFieldValidator
} from "./RequiredFieldValidator.js";

export class ForgeValidator {
    constructor() {
        this.requiredFieldValidator =
            new RequiredFieldValidator();
    }

    validateInput(input) {
        const required =
            this.requiredFieldValidator.validate(input);

        const warnings =
            this.createWarnings(input);

        return {
            valid: required.valid,
            errors: required.errors,
            warnings
        };
    }

    createWarnings(input) {
        const warnings = [];

        if (input.sellerType === "unknown") {
            warnings.push(
                "Seller type has not been classified."
            );
        }

        if (input.availability === "unknown") {
            warnings.push(
                "Availability is unknown."
            );
        }

        return warnings;
    }
}