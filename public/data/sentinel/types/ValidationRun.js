import ValidationResult, {
    VALIDATION_RESULTS
} from "./ValidationResult.js";

/**
 * Final workflow decisions returned by Sentinel to Forge.
 */
export const SENTINEL_DECISIONS = Object.freeze({
    READY: "READY",
    READY_WITH_WARNINGS: "READY_WITH_WARNINGS",
    REVIEW: "REVIEW",
    BLOCKED: "BLOCKED"
});

/**
 * Object classes supported by the Sentinel Rule Specification.
 */
export const VALIDATION_OBJECT_TYPES = Object.freeze({
    ATLAS_RECORD: "ATLAS_RECORD",
    MERCURY_OBSERVATION: "MERCURY_OBSERVATION",
    PUBLICATION_CANDIDATE: "PUBLICATION_CANDIDATE",
    TEMPLATE_RENDER: "TEMPLATE_RENDER",
    WORKFLOW_ACTION: "WORKFLOW_ACTION"
});

const DECISION_VALUES = new Set(
    Object.values(SENTINEL_DECISIONS)
);

const OBJECT_TYPE_VALUES = new Set(
    Object.values(VALIDATION_OBJECT_TYPES)
);

/**
 * Represents one complete Sentinel validation execution.
 *
 * A ValidationRun stores rule results and audit metadata. It does not execute
 * rules or calculate the final decision; those responsibilities belong to the
 * ValidationRunner and DecisionAggregator respectively.
 */
export class ValidationRun {
    constructor({
        validationRunId,
        ruleSetVersion,
        configurationVersion,
        objectType,
        objectId,
        objectRevision,
        triggeredBy,
        exceptionSetVersion = null,
        startedAt = new Date().toISOString()
    }) {
        ValidationRun.assertRequiredString(
            "validationRunId",
            validationRunId
        );
        ValidationRun.assertRequiredString(
            "ruleSetVersion",
            ruleSetVersion
        );
        ValidationRun.assertRequiredString(
            "configurationVersion",
            configurationVersion
        );
        ValidationRun.assertEnum(
            "objectType",
            objectType,
            OBJECT_TYPE_VALUES
        );
        ValidationRun.assertRequiredString(
            "objectId",
            objectId
        );
        ValidationRun.assertRevision(objectRevision);
        ValidationRun.assertRequiredString(
            "triggeredBy",
            triggeredBy
        );
        ValidationRun.assertOptionalString(
            "exceptionSetVersion",
            exceptionSetVersion
        );

        const normalizedStartedAt =
            ValidationRun.normalizeTimestamp("startedAt", startedAt);

        this.validationRunId = validationRunId;
        this.ruleSetVersion = ruleSetVersion;
        this.configurationVersion = configurationVersion;
        this.objectType = objectType;
        this.objectId = objectId;
        this.objectRevision = objectRevision;
        this.triggeredBy = triggeredBy;
        this.exceptionSetVersion = exceptionSetVersion;
        this.startedAt = normalizedStartedAt;
        this.completedAt = null;
        this.overallDecision = null;

        this._results = [];
        this._complete = false;
    }

    /**
     * Adds one canonical rule result to the active run.
     */
    addResult(result) {
        this.assertActive();

        if (!(result instanceof ValidationResult)) {
            throw new TypeError(
                "ValidationRun accepts only ValidationResult instances."
            );
        }

        this._results.push(result);
        return this;
    }

    /**
     * Completes and seals the run with a decision supplied by the aggregator.
     */
    complete(
        overallDecision,
        completedAt = new Date().toISOString()
    ) {
        this.assertActive();
        ValidationRun.assertEnum(
            "overallDecision",
            overallDecision,
            DECISION_VALUES
        );

        const normalizedCompletedAt =
            ValidationRun.normalizeTimestamp(
                "completedAt",
                completedAt
            );

        if (
            Date.parse(normalizedCompletedAt) <
            Date.parse(this.startedAt)
        ) {
            throw new RangeError(
                "ValidationRun completedAt cannot precede startedAt."
            );
        }

        this.completedAt = normalizedCompletedAt;
        this.overallDecision = overallDecision;
        this._results = Object.freeze([...this._results]);
        this._complete = true;

        Object.freeze(this);
        return this;
    }

    isComplete() {
        return this._complete;
    }

    getResults() {
        return [...this._results];
    }

    getFailures() {
        return this._results.filter(
            ({ result }) => result === VALIDATION_RESULTS.FAIL
        );
    }

    getWarnings() {
        return this._results.filter(
            ({ result }) => result === VALIDATION_RESULTS.WARN
        );
    }

    getErrors() {
        return this._results.filter(
            ({ result }) => result === VALIDATION_RESULTS.ERROR
        );
    }

    getBlockingResults() {
        return this._results.filter(
            ({ blocksForge }) => blocksForge
        );
    }

    getSummary() {
        const summary = {
            total: this._results.length,
            applicable: 0,
            pass: 0,
            warn: 0,
            fail: 0,
            error: 0,
            notApplicable: 0
        };

        for (const validationResult of this._results) {
            switch (validationResult.result) {
                case VALIDATION_RESULTS.PASS:
                    summary.pass += 1;
                    summary.applicable += 1;
                    break;
                case VALIDATION_RESULTS.WARN:
                    summary.warn += 1;
                    summary.applicable += 1;
                    break;
                case VALIDATION_RESULTS.FAIL:
                    summary.fail += 1;
                    summary.applicable += 1;
                    break;
                case VALIDATION_RESULTS.ERROR:
                    summary.error += 1;
                    summary.applicable += 1;
                    break;
                case VALIDATION_RESULTS.NOT_APPLICABLE:
                    summary.notApplicable += 1;
                    break;
                default:
                    throw new Error(
                        `Unsupported validation result: ${validationResult.result}.`
                    );
            }
        }

        return Object.freeze(summary);
    }

    toJSON() {
        return {
            validationRunId: this.validationRunId,
            ruleSetVersion: this.ruleSetVersion,
            configurationVersion: this.configurationVersion,
            objectType: this.objectType,
            objectId: this.objectId,
            objectRevision: this.objectRevision,
            triggeredBy: this.triggeredBy,
            exceptionSetVersion: this.exceptionSetVersion,
            startedAt: this.startedAt,
            completedAt: this.completedAt,
            overallDecision: this.overallDecision,
            summary: { ...this.getSummary() },
            results: this._results.map((result) => result.toJSON())
        };
    }

    assertActive() {
        if (this._complete) {
            throw new Error(
                "Completed ValidationRun instances are immutable."
            );
        }
    }

    static normalizeTimestamp(name, value) {
        const date = value instanceof Date
            ? value
            : new Date(value);

        if (Number.isNaN(date.getTime())) {
            throw new TypeError(
                `ValidationRun ${name} must be a valid date or timestamp.`
            );
        }

        return date.toISOString();
    }

    static assertRequiredString(name, value) {
        if (
            typeof value !== "string" ||
            value.trim().length === 0
        ) {
            throw new TypeError(
                `ValidationRun requires a non-empty ${name}.`
            );
        }
    }

    static assertOptionalString(name, value) {
        if (
            value !== null &&
            (typeof value !== "string" || value.trim().length === 0)
        ) {
            throw new TypeError(
                `ValidationRun ${name} must be a non-empty string or null.`
            );
        }
    }

    static assertRevision(value) {
        const validString =
            typeof value === "string" && value.trim().length > 0;
        const validNumber =
            typeof value === "number" && Number.isFinite(value);

        if (!validString && !validNumber) {
            throw new TypeError(
                "ValidationRun objectRevision must be a non-empty string or finite number."
            );
        }
    }

    static assertEnum(name, value, allowedValues) {
        if (!allowedValues.has(value)) {
            throw new TypeError(
                `ValidationRun ${name} is invalid: ${value}.`
            );
        }
    }
}

export default ValidationRun;
