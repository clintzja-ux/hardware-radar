/**
 * Canonical result returned by every Sentinel rule.
 *
 * Sentinel Rule Specification:
 * - result: PASS | WARN | FAIL | NOT_APPLICABLE | ERROR
 * - severity: CRITICAL | HIGH | MEDIUM | LOW | INFO
 * - forgeEffect: BLOCKED | REVIEW | WARN | NONE
 */

export const VALIDATION_RESULTS = Object.freeze({
    PASS: "PASS",
    WARN: "WARN",
    FAIL: "FAIL",
    NOT_APPLICABLE: "NOT_APPLICABLE",
    ERROR: "ERROR"
});

export const VALIDATION_SEVERITIES = Object.freeze({
    CRITICAL: "CRITICAL",
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW",
    INFO: "INFO"
});

export const FORGE_EFFECTS = Object.freeze({
    BLOCKED: "BLOCKED",
    REVIEW: "REVIEW",
    WARN: "WARN",
    NONE: "NONE"
});

const RESULT_VALUES = new Set(
    Object.values(VALIDATION_RESULTS)
);

const SEVERITY_VALUES = new Set(
    Object.values(VALIDATION_SEVERITIES)
);

const FORGE_EFFECT_VALUES = new Set(
    Object.values(FORGE_EFFECTS)
);

export class ValidationResult {
    constructor({
        ruleId,
        result,
        severity,
        failureCode = null,
        message = null,
        evidence = {},
        forgeEffect = FORGE_EFFECTS.NONE,
        remediation = null,
        metadata = {}
    }) {
        ValidationResult.assertRuleId(ruleId);
        ValidationResult.assertEnum(
            "result",
            result,
            RESULT_VALUES
        );
        ValidationResult.assertEnum(
            "severity",
            severity,
            SEVERITY_VALUES
        );
        ValidationResult.assertEnum(
            "forgeEffect",
            forgeEffect,
            FORGE_EFFECT_VALUES
        );
        ValidationResult.assertOptionalString(
            "failureCode",
            failureCode
        );
        ValidationResult.assertOptionalString(
            "message",
            message
        );
        ValidationResult.assertOptionalString(
            "remediation",
            remediation
        );
        ValidationResult.assertPlainObject(
            "evidence",
            evidence
        );
        ValidationResult.assertPlainObject(
            "metadata",
            metadata
        );
        ValidationResult.assertResultConsistency({
            result,
            failureCode
        });

        this.ruleId = ruleId;
        this.result = result;
        this.severity = severity;
        this.failureCode = failureCode;
        this.message = message;
        this.evidence = Object.freeze({ ...evidence });
        this.forgeEffect = forgeEffect;
        this.remediation = remediation;
        this.metadata = Object.freeze({ ...metadata });

        Object.freeze(this);
    }

    /**
     * Compatibility alias for consumers that refer to a rule result as status.
     */
    get status() {
        return this.result;
    }

    get passed() {
        return this.result === VALIDATION_RESULTS.PASS;
    }

    get failed() {
        return this.result === VALIDATION_RESULTS.FAIL;
    }

    get errored() {
        return this.result === VALIDATION_RESULTS.ERROR;
    }

    get applicable() {
        return this.result !==
            VALIDATION_RESULTS.NOT_APPLICABLE;
    }

    get blocksForge() {
        return this.forgeEffect ===
            FORGE_EFFECTS.BLOCKED;
    }

    toJSON() {
        return {
            ruleId: this.ruleId,
            result: this.result,
            severity: this.severity,
            failureCode: this.failureCode,
            message: this.message,
            evidence: { ...this.evidence },
            forgeEffect: this.forgeEffect,
            remediation: this.remediation,
            metadata: { ...this.metadata }
        };
    }

    static pass(options) {
        return new ValidationResult({
            ...options,
            result: VALIDATION_RESULTS.PASS,
            failureCode: null,
            forgeEffect:
                options?.forgeEffect ?? FORGE_EFFECTS.NONE
        });
    }

    static warn(options) {
        return new ValidationResult({
            ...options,
            result: VALIDATION_RESULTS.WARN,
            forgeEffect:
                options?.forgeEffect ?? FORGE_EFFECTS.WARN
        });
    }

    static fail(options) {
        return new ValidationResult({
            ...options,
            result: VALIDATION_RESULTS.FAIL
        });
    }

    static notApplicable(options) {
        return new ValidationResult({
            ...options,
            result: VALIDATION_RESULTS.NOT_APPLICABLE,
            failureCode: null,
            forgeEffect: FORGE_EFFECTS.NONE
        });
    }

    static error(options) {
        return new ValidationResult({
            ...options,
            result: VALIDATION_RESULTS.ERROR
        });
    }

    static assertRuleId(ruleId) {
        if (
            typeof ruleId !== "string" ||
            ruleId.trim().length === 0
        ) {
            throw new TypeError(
                "ValidationResult requires a non-empty ruleId."
            );
        }
    }

    static assertEnum(name, value, allowedValues) {
        if (!allowedValues.has(value)) {
            throw new TypeError(
                `ValidationResult ${name} is invalid: ${value}.`
            );
        }
    }

    static assertOptionalString(name, value) {
        if (
            value !== null &&
            typeof value !== "string"
        ) {
            throw new TypeError(
                `ValidationResult ${name} must be a string or null.`
            );
        }
    }

    static assertPlainObject(name, value) {
        if (
            value === null ||
            typeof value !== "object" ||
            Array.isArray(value)
        ) {
            throw new TypeError(
                `ValidationResult ${name} must be an object.`
            );
        }
    }

    static assertResultConsistency({
        result,
        failureCode
    }) {
        const requiresFailureCode =
            result === VALIDATION_RESULTS.FAIL ||
            result === VALIDATION_RESULTS.ERROR;

        if (requiresFailureCode && !failureCode) {
            throw new Error(
                `${result} results require a failureCode.`
            );
        }

        const forbidsFailureCode =
            result === VALIDATION_RESULTS.PASS ||
            result === VALIDATION_RESULTS.NOT_APPLICABLE;

        if (forbidsFailureCode && failureCode) {
            throw new Error(
                `${result} results must not include a failureCode.`
            );
        }
    }
}

export default ValidationResult;
