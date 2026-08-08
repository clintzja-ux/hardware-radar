import RuleRegistry from "../core/RuleRegistry.js";
import ValidationResult, {
    FORGE_EFFECTS,
    VALIDATION_RESULTS,
    VALIDATION_SEVERITIES
} from "../types/ValidationResult.js";

const INTERNAL_RULE_PREFIX = "SENTINEL-CORE";

const DEFAULT_FORGE_EFFECT_BY_SEVERITY = Object.freeze({
    [VALIDATION_SEVERITIES.CRITICAL]: FORGE_EFFECTS.BLOCKED,
    [VALIDATION_SEVERITIES.HIGH]: FORGE_EFFECTS.BLOCKED,
    [VALIDATION_SEVERITIES.MEDIUM]: FORGE_EFFECTS.REVIEW,
    [VALIDATION_SEVERITIES.LOW]: FORGE_EFFECTS.WARN,
    [VALIDATION_SEVERITIES.INFO]: FORGE_EFFECTS.NONE
});

/**
 * Executes product-agnostic Sentinel rules.
 *
 * CoreValidator owns rule execution and result normalization only. It does not
 * discover rule sets, aggregate decisions, mutate ValidationRuns, or contain
 * product-extension knowledge.
 */
export class CoreValidator {
    /**
     * Executes all core rules in deterministic registry/rule order.
     *
     * @param {object} payload
     * @param {object} payload.subject Object being validated.
     * @param {object[]} payload.ruleSets Registered Sentinel rule sets.
     * @param {object} [payload.context] Read-only execution context.
     * @returns {ValidationResult[]}
     */
    validate({ subject, ruleSets, context = {} }) {
        CoreValidator.assertSubject(subject);
        CoreValidator.assertRuleSets(ruleSets);
        CoreValidator.assertContext(context);

        const results = [];
        const coreRuleSets = ruleSets.filter(
            (ruleSet) => RuleRegistry.getExtensions(ruleSet).length === 0
        );

        for (const ruleSet of coreRuleSets) {
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
            CoreValidator.assertRule(rule);

            const outcome = rule.validate(subject, Object.freeze({
                ...context,
                ruleSetId: ruleSet.id,
                ruleSetVersion: ruleSet.version,
                ruleId: CoreValidator.resolveRuleId(rule)
            }));

            if (outcome instanceof Promise) {
                throw new TypeError(
                    "Core rules must execute synchronously."
                );
            }

            return CoreValidator.normalizeOutcome({
                rule,
                ruleSet,
                outcome
            });
        } catch (error) {
            return CoreValidator.createRuleError({
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
                ? CoreValidator.createPass(rule, ruleSet)
                : CoreValidator.createFail(rule, ruleSet);
        }

        if (CoreValidator.isPlainObject(outcome)) {
            return CoreValidator.createStructuredResult(
                rule,
                ruleSet,
                outcome
            );
        }

        throw new TypeError(
            "Core rule validate() must return a boolean, result descriptor, or ValidationResult."
        );
    }

    static createPass(rule, ruleSet) {
        return ValidationResult.pass({
            ruleId: CoreValidator.resolveRuleId(rule),
            severity: rule.severity,
            message: rule.passMessage ?? rule.message ?? null,
            evidence: CoreValidator.clonePlainObject(rule.passEvidence),
            forgeEffect: FORGE_EFFECTS.NONE,
            metadata: CoreValidator.buildMetadata(ruleSet, rule)
        });
    }

    static createFail(rule, ruleSet) {
        return ValidationResult.fail({
            ruleId: CoreValidator.resolveRuleId(rule),
            severity: rule.severity,
            failureCode: rule.failureCode,
            message: rule.failureMessage ?? rule.message ?? rule.title ?? null,
            evidence: CoreValidator.clonePlainObject(rule.failureEvidence),
            forgeEffect:
                rule.forgeEffect ??
                DEFAULT_FORGE_EFFECT_BY_SEVERITY[rule.severity],
            remediation: rule.remediation ?? null,
            metadata: CoreValidator.buildMetadata(ruleSet, rule)
        });
    }

    static createStructuredResult(rule, ruleSet, outcome) {
        const result = outcome.result ?? outcome.status;

        if (!Object.values(VALIDATION_RESULTS).includes(result)) {
            throw new TypeError(
                "Core rule result descriptor requires a valid result."
            );
        }

        const common = {
            ruleId: CoreValidator.resolveRuleId(rule),
            severity: outcome.severity ?? rule.severity,
            message: outcome.message ?? CoreValidator.defaultMessage(rule, result),
            evidence: CoreValidator.clonePlainObject(outcome.evidence),
            remediation: outcome.remediation ?? rule.remediation ?? null,
            metadata: {
                ...CoreValidator.buildMetadata(ruleSet, rule),
                ...CoreValidator.clonePlainObject(outcome.metadata)
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
        const ruleId = CoreValidator.tryResolveRuleId(rule) ??
            `${INTERNAL_RULE_PREFIX}-${ruleSet.id}-${ruleIndex + 1}`;
        const severity = CoreValidator.isValidSeverity(rule?.severity)
            ? rule.severity
            : VALIDATION_SEVERITIES.CRITICAL;

        return ValidationResult.error({
            ruleId,
            severity,
            failureCode: "CORE_RULE_EXECUTION_ERROR",
            message: `Core rule ${ruleId} could not be executed.`,
            evidence: {
                errorName: normalizedError.name,
                errorMessage: normalizedError.message
            },
            forgeEffect:
                rule?.forgeEffect ??
                DEFAULT_FORGE_EFFECT_BY_SEVERITY[severity],
            remediation:
                "Inspect the core rule definition and validator implementation.",
            metadata: {
                validator: "CoreValidator",
                ruleSetId: ruleSet.id,
                ruleSetVersion: ruleSet.version,
                ruleIndex
            }
        });
    }

    static assertRule(rule) {
        if (!CoreValidator.isPlainObject(rule)) {
            throw new TypeError("Core rule must be a plain object.");
        }

        CoreValidator.resolveRuleId(rule);

        if (!CoreValidator.isValidSeverity(rule.severity)) {
            throw new TypeError(
                `Core rule severity is invalid: ${rule.severity}.`
            );
        }

        if (typeof rule.validate !== "function") {
            throw new TypeError(
                "Core rule requires a validate() function."
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
                "Core rule failureCode must be a non-empty string."
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
                "Core rule requires a non-empty ruleId or id."
            );
        }

        return ruleId.trim();
    }

    static tryResolveRuleId(rule) {
        try {
            return CoreValidator.resolveRuleId(rule);
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
            validator: "CoreValidator",
            ruleSetId: ruleSet.id,
            ruleSetVersion: ruleSet.version,
            domain: rule.domain ?? null
        };
    }

    static clonePlainObject(value) {
        if (value === undefined || value === null) {
            return {};
        }

        if (!CoreValidator.isPlainObject(value)) {
            throw new TypeError("Rule evidence and metadata must be objects.");
        }

        return { ...value };
    }

    static isValidSeverity(value) {
        return Object.values(VALIDATION_SEVERITIES).includes(value);
    }

    static assertSubject(subject) {
        if (!CoreValidator.isPlainObject(subject)) {
            throw new TypeError(
                "CoreValidator subject must be a plain object."
            );
        }
    }

    static assertRuleSets(ruleSets) {
        if (!Array.isArray(ruleSets)) {
            throw new TypeError(
                "CoreValidator ruleSets must be an array."
            );
        }

        for (const ruleSet of ruleSets) {
            if (!CoreValidator.isPlainObject(ruleSet)) {
                throw new TypeError(
                    "CoreValidator ruleSets must contain plain objects."
                );
            }

            if (!Array.isArray(ruleSet.rules)) {
                throw new TypeError(
                    "CoreValidator ruleSet.rules must be an array."
                );
            }
        }
    }

    static assertContext(context) {
        if (!CoreValidator.isPlainObject(context)) {
            throw new TypeError(
                "CoreValidator context must be a plain object."
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

export default CoreValidator;
