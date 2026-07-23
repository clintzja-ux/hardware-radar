import ValidationResult, {
    FORGE_EFFECTS,
    VALIDATION_RESULTS,
    VALIDATION_SEVERITIES
} from "../types/ValidationResult.js";

const INTERNAL_RULE_PREFIX = "SENTINEL-EXTENSION";

const DEFAULT_FORGE_EFFECT_BY_SEVERITY = Object.freeze({
    [VALIDATION_SEVERITIES.CRITICAL]: FORGE_EFFECTS.BLOCKED,
    [VALIDATION_SEVERITIES.HIGH]: FORGE_EFFECTS.BLOCKED,
    [VALIDATION_SEVERITIES.MEDIUM]: FORGE_EFFECTS.REVIEW,
    [VALIDATION_SEVERITIES.LOW]: FORGE_EFFECTS.WARN,
    [VALIDATION_SEVERITIES.INFO]: FORGE_EFFECTS.NONE
});

/**
 * Executes extension Sentinel rules.
 *
 * ExtensionValidator owns rule execution and result normalization only. It does not
 * discover rule sets, aggregate decisions, mutate ValidationRuns, or interpret
 * product-extension knowledge.
 */
export class ExtensionValidator {
    /**
     * Executes all supplied extension rules in deterministic registry/rule order.
     *
     * @param {object} payload
     * @param {object} payload.subject Object being validated.
     * @param {object[]} payload.ruleSets Registered Sentinel rule sets.
     * @param {object} [payload.context] Read-only execution context.
     * @returns {ValidationResult[]}
     */
    validate({ subject, ruleSets, context = {} }) {
        ExtensionValidator.assertSubject(subject);
        ExtensionValidator.assertRuleSets(ruleSets);
        ExtensionValidator.assertContext(context);

        const results = [];

        for (const ruleSet of ruleSets) {
            for (let index = 0; index < ruleSet.rules.length; index += 1) {
                const rule = ruleSet.rules[index];
                results.push(
                    this.executeRule({
                        rule,
                        ruleSet,
                        ruleIndex: index,
                        subject,
                        context
                    })
                );
            }
        }

        return results;
    }

    executeRule({ rule, ruleSet, ruleIndex, subject, context }) {
        try {
            ExtensionValidator.assertRule(rule);

            const outcome = rule.validate(subject, Object.freeze({
                ...context,
                ruleSetId: ruleSet.id,
                ruleSetVersion: ruleSet.version,
                ruleId: ExtensionValidator.resolveRuleId(rule)
            }));

            if (outcome instanceof Promise) {
                throw new TypeError(
                    "Extension rules must execute synchronously."
                );
            }

            return ExtensionValidator.normalizeOutcome({
                rule,
                ruleSet,
                outcome
            });
        } catch (error) {
            return ExtensionValidator.createRuleError({
                rule,
                ruleSet,
                ruleIndex,
                error
            });
        }
    }

    static normalizeOutcome({ rule, ruleSet, outcome }) {
        if (outcome instanceof ValidationResult) {
            return outcome;
        }

        if (typeof outcome === "boolean") {
            return outcome
                ? ExtensionValidator.createPass(rule, ruleSet)
                : ExtensionValidator.createFail(rule, ruleSet);
        }

        if (ExtensionValidator.isPlainObject(outcome)) {
            return ExtensionValidator.createStructuredResult(
                rule,
                ruleSet,
                outcome
            );
        }

        throw new TypeError(
            "Extension rule validate() must return a boolean, result descriptor, or ValidationResult."
        );
    }

    static createPass(rule, ruleSet) {
        return ValidationResult.pass({
            ruleId: ExtensionValidator.resolveRuleId(rule),
            severity: rule.severity,
            message: rule.passMessage ?? rule.message ?? null,
            evidence: ExtensionValidator.clonePlainObject(rule.passEvidence),
            forgeEffect: FORGE_EFFECTS.NONE,
            metadata: ExtensionValidator.buildMetadata(ruleSet, rule)
        });
    }

    static createFail(rule, ruleSet) {
        return ValidationResult.fail({
            ruleId: ExtensionValidator.resolveRuleId(rule),
            severity: rule.severity,
            failureCode: rule.failureCode,
            message: rule.failureMessage ?? rule.message ?? rule.title ?? null,
            evidence: ExtensionValidator.clonePlainObject(rule.failureEvidence),
            forgeEffect:
                rule.forgeEffect ??
                DEFAULT_FORGE_EFFECT_BY_SEVERITY[rule.severity],
            remediation: rule.remediation ?? null,
            metadata: ExtensionValidator.buildMetadata(ruleSet, rule)
        });
    }

    static createStructuredResult(rule, ruleSet, outcome) {
        const result = outcome.result ?? outcome.status;

        if (!Object.values(VALIDATION_RESULTS).includes(result)) {
            throw new TypeError(
                "Extension rule result descriptor requires a valid result."
            );
        }

        const common = {
            ruleId: ExtensionValidator.resolveRuleId(rule),
            severity: outcome.severity ?? rule.severity,
            message: outcome.message ?? ExtensionValidator.defaultMessage(rule, result),
            evidence: ExtensionValidator.clonePlainObject(outcome.evidence),
            remediation: outcome.remediation ?? rule.remediation ?? null,
            metadata: {
                ...ExtensionValidator.buildMetadata(ruleSet, rule),
                ...ExtensionValidator.clonePlainObject(outcome.metadata)
            }
        };

        switch (result) {
            case VALIDATION_RESULTS.PASS:
                return ValidationResult.pass({
                    ...common,
                    forgeEffect: outcome.forgeEffect ?? FORGE_EFFECTS.NONE
                });
            case VALIDATION_RESULTS.WARN:
                return ValidationResult.warn({
                    ...common,
                    failureCode:
                        outcome.failureCode ?? rule.failureCode ?? null,
                    forgeEffect:
                        outcome.forgeEffect ??
                        rule.forgeEffect ??
                        FORGE_EFFECTS.WARN
                });
            case VALIDATION_RESULTS.FAIL:
                return ValidationResult.fail({
                    ...common,
                    failureCode: outcome.failureCode ?? rule.failureCode,
                    forgeEffect:
                        outcome.forgeEffect ??
                        rule.forgeEffect ??
                        DEFAULT_FORGE_EFFECT_BY_SEVERITY[common.severity]
                });
            case VALIDATION_RESULTS.NOT_APPLICABLE:
                return ValidationResult.notApplicable(common);
            case VALIDATION_RESULTS.ERROR:
                return ValidationResult.error({
                    ...common,
                    failureCode:
                        outcome.failureCode ??
                        rule.failureCode ??
                        "RULE_EXECUTION_ERROR",
                    forgeEffect:
                        outcome.forgeEffect ??
                        rule.forgeEffect ??
                        DEFAULT_FORGE_EFFECT_BY_SEVERITY[common.severity]
                });
            default:
                throw new TypeError(`Unsupported result: ${result}.`);
        }
    }

    static createRuleError({ rule, ruleSet, ruleIndex, error }) {
        const normalizedError = error instanceof Error
            ? error
            : new Error(String(error));
        const ruleId = ExtensionValidator.tryResolveRuleId(rule) ??
            `${INTERNAL_RULE_PREFIX}-${ruleSet.id}-${ruleIndex + 1}`;
        const severity = ExtensionValidator.isValidSeverity(rule?.severity)
            ? rule.severity
            : VALIDATION_SEVERITIES.CRITICAL;

        return ValidationResult.error({
            ruleId,
            severity,
            failureCode: "EXTENSION_RULE_EXECUTION_ERROR",
            message: `Extension rule ${ruleId} could not be executed.`,
            evidence: {
                errorName: normalizedError.name,
                errorMessage: normalizedError.message
            },
            forgeEffect:
                rule?.forgeEffect ??
                DEFAULT_FORGE_EFFECT_BY_SEVERITY[severity],
            remediation:
                "Inspect the extension rule definition and validator implementation.",
            metadata: {
                validator: "ExtensionValidator",
                ruleSetId: ruleSet.id,
                ruleSetVersion: ruleSet.version,
                ruleIndex
            }
        });
    }

    static assertRule(rule) {
        if (!ExtensionValidator.isPlainObject(rule)) {
            throw new TypeError("Extension rule must be a plain object.");
        }

        ExtensionValidator.resolveRuleId(rule);

        if (!ExtensionValidator.isValidSeverity(rule.severity)) {
            throw new TypeError(
                `Extension rule severity is invalid: ${rule.severity}.`
            );
        }

        if (typeof rule.validate !== "function") {
            throw new TypeError(
                "Extension rule requires a validate() function."
            );
        }

        if (
            rule.failureCode !== undefined &&
            (
                typeof rule.failureCode !== "string" ||
                rule.failureCode.trim().length === 0
            )
        ) {
            throw new TypeError(
                "Extension rule failureCode must be a non-empty string."
            );
        }
    }

    static resolveRuleId(rule) {
        const ruleId = rule?.ruleId ?? rule?.id;

        if (
            typeof ruleId !== "string" ||
            ruleId.trim().length === 0
        ) {
            throw new TypeError(
                "Extension rule requires a non-empty ruleId or id."
            );
        }

        return ruleId.trim();
    }

    static tryResolveRuleId(rule) {
        try {
            return ExtensionValidator.resolveRuleId(rule);
        } catch {
            return null;
        }
    }

    static defaultMessage(rule, result) {
        if (result === VALIDATION_RESULTS.FAIL) {
            return rule.failureMessage ?? rule.message ?? rule.title ?? null;
        }

        if (result === VALIDATION_RESULTS.PASS) {
            return rule.passMessage ?? rule.message ?? null;
        }

        return rule.message ?? rule.failureMessage ?? rule.title ?? null;
    }

    static buildMetadata(ruleSet, rule) {
        return {
            validator: "ExtensionValidator",
            ruleSetId: ruleSet.id,
            ruleSetVersion: ruleSet.version,
            domain: rule.domain ?? null
        };
    }

    static clonePlainObject(value) {
        if (value === undefined || value === null) {
            return {};
        }

        if (!ExtensionValidator.isPlainObject(value)) {
            throw new TypeError("Rule evidence and metadata must be objects.");
        }

        return { ...value };
    }

    static isValidSeverity(value) {
        return Object.values(VALIDATION_SEVERITIES).includes(value);
    }

    static assertSubject(subject) {
        if (!ExtensionValidator.isPlainObject(subject)) {
            throw new TypeError(
                "ExtensionValidator subject must be a plain object."
            );
        }
    }

    static assertRuleSets(ruleSets) {
        if (!Array.isArray(ruleSets)) {
            throw new TypeError(
                "ExtensionValidator ruleSets must be an array."
            );
        }

        for (const ruleSet of ruleSets) {
            if (!ExtensionValidator.isPlainObject(ruleSet)) {
                throw new TypeError(
                    "ExtensionValidator ruleSets must contain plain objects."
                );
            }

            if (!Array.isArray(ruleSet.rules)) {
                throw new TypeError(
                    "ExtensionValidator ruleSet.rules must be an array."
                );
            }
        }
    }

    static assertContext(context) {
        if (!ExtensionValidator.isPlainObject(context)) {
            throw new TypeError(
                "ExtensionValidator context must be a plain object."
            );
        }
    }

    static isPlainObject(value) {
        if (
            value === null ||
            typeof value !== "object" ||
            Array.isArray(value)
        ) {
            return false;
        }

        const prototype = Object.getPrototypeOf(value);
        return prototype === Object.prototype || prototype === null;
    }
}

export default ExtensionValidator;
