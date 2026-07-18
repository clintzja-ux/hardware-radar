export class EngineeringValidator {
    validate(input) {
        if (!input?.ram) {
            return {
                observations: [],
                warnings: [],
                confirmations: []
            };
        }

        const observations = [
            ...this.validateCapacityDistribution(input.ram),
            ...this.validateXmpConsistency(input.ram),
            ...this.validateExpoConsistency(input.ram),
            ...this.validateRegisteredBuffering(input.ram),
            ...this.validateModuleCount(input.ram)
        ];

        return {
            observations,

            warnings: observations.filter(
                observation =>
                    observation.severity === "warning"
            ),

            confirmations: observations.filter(
                observation =>
                    observation.severity === "info"
            )
        };
    }

    validateCapacityDistribution(ram) {
        const capacityGB =
            this.toFiniteNumber(
                ram.memory?.capacityGB
            );

        const moduleCount =
            this.toFiniteNumber(
                ram.memory?.moduleCount
            );

        if (
            capacityGB === null ||
            moduleCount === null ||
            moduleCount <= 0
        ) {
            return [];
        }

        if (capacityGB % moduleCount !== 0) {
            return [
                this.createObservation({
                    code: "RAM001",
                    message:
                        "Total capacity is not evenly divisible by module count.",
                    severity: "warning",
                    field: "ram.memory.capacityGB"
                })
            ];
        }

        return [
            this.createObservation({
                code: "RAM101",
                message:
                    `Capacity distribution verified: ` +
                    `${capacityGB / moduleCount} GB per module.`,
                severity: "info",
                field:
                    "ram.memory.capacityPerModuleGB"
            })
        ];
    }

    validateXmpConsistency(ram) {
        const xmp =
            ram.technology?.xmp;

        if (!xmp) {
            return [];
        }

        const supported =
            this.toBoolean(xmp.supported);

        const version =
            this.normalizeText(xmp.version);

        if (
            supported === false &&
            version !== null
        ) {
            return [
                this.createObservation({
                    code: "RAM002",
                    message:
                        "XMP version is specified while XMP support is disabled.",
                    severity: "warning",
                    field:
                        "ram.technology.xmp.version"
                })
            ];
        }

        return [];
    }

    validateExpoConsistency(ram) {
        const expo =
            ram.technology?.expo;

        if (!expo) {
            return [];
        }

        const supported =
            this.toBoolean(expo.supported);

        const version =
            this.normalizeText(expo.version);

        if (
            supported === false &&
            version !== null
        ) {
            return [
                this.createObservation({
                    code: "RAM003",
                    message:
                        "EXPO version is specified while EXPO support is disabled.",
                    severity: "warning",
                    field:
                        "ram.technology.expo.version"
                })
            ];
        }

        return [];
    }

    validateRegisteredBuffering(ram) {
        const technology =
            ram.technology;

        if (!technology) {
            return [];
        }

        const registered =
            this.toBoolean(
                technology.registered
            );

        const buffered =
            this.toBoolean(
                technology.buffered
            );

        if (
            registered === true &&
            buffered === false
        ) {
            return [
                this.createObservation({
                    code: "RAM004",
                    message:
                        "Registered memory is marked as unbuffered. Review these specifications.",
                    severity: "warning",
                    field:
                        "ram.technology.buffered"
                })
            ];
        }

        return [];
    }

    validateModuleCount(ram) {
        const moduleCount =
            this.toFiniteNumber(
                ram.memory?.moduleCount
            );

        if (moduleCount === null) {
            return [];
        }

        if (moduleCount <= 0) {
            return [
                this.createObservation({
                    code: "RAM005",
                    message:
                        "Module count must be greater than zero.",
                    severity: "warning",
                    field:
                        "ram.memory.moduleCount"
                })
            ];
        }

        const commonModuleCounts =
            [1, 2, 4, 8];

        if (
            !commonModuleCounts.includes(
                moduleCount
            )
        ) {
            return [
                this.createObservation({
                    code: "RAM006",
                    message:
                        `A module count of ${moduleCount} is unusual. Verify the product configuration.`,
                    severity: "warning",
                    field:
                        "ram.memory.moduleCount"
                })
            ];
        }

        return [];
    }

    createObservation({
        code,
        message,
        severity,
        field = null
    }) {
        return {
            code,
            message,
            severity,
            field
        };
    }

    toFiniteNumber(value) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return null;
        }

        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : null;
    }

    toBoolean(value) {
        if (value === true || value === false) {
            return value;
        }

        if (value === "true") {
            return true;
        }

        if (value === "false") {
            return false;
        }

        return null;
    }

    normalizeText(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return null;
        }

        const normalized =
            String(value).trim();

        return normalized.length > 0
            ? normalized
            : null;
    }
}