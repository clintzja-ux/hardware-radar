import {
    RequiredFieldValidator
} from "./RequiredFieldValidator.js";

import {
    EngineeringValidator
} from "./EngineeringValidator.js";

export class ForgeValidator {
    constructor() {
        this.requiredFieldValidator =
            new RequiredFieldValidator();

        this.engineeringValidator =
            new EngineeringValidator();
    }

    validateInput(input) {
        const required =
            this.requiredFieldValidator.validate(input);

        const engineering =
            this.engineeringValidator.validate(input);

        const existingWarnings =
            this.createWarnings(input);

        const engineeringWarningMessages =
            engineering.warnings.map(
                observation =>
                    observation.message
            );

        return {
            valid: required.valid,

            errors:
                required.errors,

            warnings: [
                ...existingWarnings,
                ...engineeringWarningMessages
            ],

            engineering: {
                observations:
                    engineering.observations,

                warnings:
                    engineering.warnings,

                confirmations:
                    engineering.confirmations
            }
        };
    }

    createWarnings(input) {
        const warnings = [];

        if (
            input.sellerType === "unknown"
        ) {
            warnings.push(
                "Seller type has not been classified."
            );
        }

        if (
            input.availability === "unknown"
        ) {
            warnings.push(
                "Availability is unknown."
            );
        }

        return warnings;
    }
}