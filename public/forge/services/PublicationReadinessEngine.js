export class PublicationReadinessEngine {
    static STATUS = Object.freeze({
        READY: "READY",
        REVIEW: "REVIEW",
        BLOCKED: "BLOCKED"
    });

    static CONFIDENCE = Object.freeze({
        HIGH: "HIGH",
        MEDIUM: "MEDIUM",
        LOW: "LOW"
    });

    static WARNING_PENALTY = 5;

    evaluate(validation) {
        if (!validation || validation.valid !== true) {
            return this.createBlockedDecision(validation);
        }

        const engineeringWarnings =
            validation.engineering?.warnings ?? [];

        if (engineeringWarnings.length === 0) {
            return this.createReadyDecision(validation);
        }

        return this.createReviewDecision(
            validation,
            engineeringWarnings
        );
    }

    createReadyDecision(validation) {
        return {
            status:
                PublicationReadinessEngine.STATUS.READY,

            confidence:
                PublicationReadinessEngine.CONFIDENCE.HIGH,

            score: 100,

            blockers: [],

            recommendations: [],

            reasoning: [
                {
                    code: "PUB001",
                    type: "confirmation",
                    message:
                        "Required validation passed."
                },
                {
                    code: "PUB002",
                    type: "confirmation",
                    message:
                        "No engineering warnings require human review."
                }
            ],

            summary: this.createSummary(validation)
        };
    }

    createReviewDecision(
        validation,
        engineeringWarnings
    ) {
        const score = this.calculateReviewScore(
            engineeringWarnings.length
        );

        return {
            status:
                PublicationReadinessEngine.STATUS.REVIEW,

            confidence:
                PublicationReadinessEngine.CONFIDENCE.MEDIUM,

            score,

            blockers: [],

            recommendations: [
                {
                    code: "PUB003",
                    message:
                        "Review the engineering warnings before publication.",
                    sourceCodes:
                        this.getObservationCodes(
                            engineeringWarnings
                        )
                }
            ],

            reasoning: [
                {
                    code: "PUB004",
                    type: "warning",
                    message:
                        `${engineeringWarnings.length} engineering warning${engineeringWarnings.length === 1 ? "" : "s"} require human review.`,
                    sourceCodes:
                        this.getObservationCodes(
                            engineeringWarnings
                        )
                }
            ],

            summary: this.createSummary(validation)
        };
    }

    createBlockedDecision(validation) {
        return {
            status:
                PublicationReadinessEngine.STATUS.BLOCKED,

            confidence:
                PublicationReadinessEngine.CONFIDENCE.LOW,

            score: 0,

            blockers: [
                {
                    code: "PUB005",
                    message:
                        "Required validation failed. Publication cannot proceed."
                }
            ],

            recommendations: [
                {
                    code: "PUB006",
                    message:
                        "Correct the required validation errors and evaluate the product again."
                }
            ],

            reasoning: [
                {
                    code: "PUB007",
                    type: "error",
                    message:
                        "The product record is structurally incomplete or invalid."
                }
            ],

            summary: this.createSummary(validation)
        };
    }

    calculateReviewScore(warningCount) {
        const score =
            100 -
            (
                warningCount *
                PublicationReadinessEngine.WARNING_PENALTY
            );

        return Math.max(
            0,
            Math.min(100, score)
        );
    }

    createSummary(validation) {
        const engineering =
            validation?.engineering ?? {};

        return {
            requiredValidationPassed:
                validation?.valid === true,

            errorCount:
                validation?.errors?.length ?? 0,

            warningCount:
                validation?.warnings?.length ?? 0,

            engineeringWarningCount:
                engineering.warnings?.length ?? 0,

            engineeringConfirmationCount:
                engineering.confirmations?.length ?? 0
        };
    }

    getObservationCodes(observations) {
        return observations
            .map(observation => observation.code)
            .filter(Boolean);
    }
}