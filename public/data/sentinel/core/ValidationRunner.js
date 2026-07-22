import DecisionAggregator from "./DecisionAggregator.js";
import RuleRegistry from "./RuleRegistry.js";
import ValidationResult, {
    FORGE_EFFECTS,
    VALIDATION_SEVERITIES
} from "../types/ValidationResult.js";
import ValidationRun, {
    VALIDATION_OBJECT_TYPES
} from "../types/ValidationRun.js";

const DEFAULT_CONFIGURATION_VERSION = "1.0.0";
const DEFAULT_RULE_SET_VERSION = "none";
const INTERNAL_ERROR_RULE_PREFIX = "SENTINEL-EXECUTION";

/**
 * Coordinates one complete Sentinel validation execution.
 *
 * ValidationRunner owns orchestration only. Validation logic belongs to the
 * injected validators, rule discovery belongs to RuleRegistry, and workflow
 * policy belongs to DecisionAggregator.
 */
export class ValidationRunner {
    constructor({
        ruleRegistry,
        coreValidator = null,
        extensionValidator = null,
        decisionAggregator = new DecisionAggregator(),
        idFactory = ValidationRunner.createValidationRunId,
        clock = () => new Date().toISOString()
    }) {
        if (!(ruleRegistry instanceof RuleRegistry)) {
            throw new TypeError(
                "ValidationRunner requires a RuleRegistry instance."
            );
        }

        ValidationRunner.assertValidator(
            "coreValidator",
            coreValidator
        );
        ValidationRunner.assertValidator(
            "extensionValidator",
            extensionValidator
        );

        if (
            !decisionAggregator ||
            typeof decisionAggregator.aggregate !== "function"
        ) {
            throw new TypeError(
                "ValidationRunner requires a decisionAggregator with an aggregate() method."
            );
        }

        if (typeof idFactory !== "function") {
            throw new TypeError(
                "ValidationRunner idFactory must be a function."
            );
        }

        if (typeof clock !== "function") {
            throw new TypeError(
                "ValidationRunner clock must be a function."
            );
        }

        this.ruleRegistry = ruleRegistry;
        this.coreValidator = coreValidator;
        this.extensionValidator = extensionValidator;
        this.decisionAggregator = decisionAggregator;
        this.idFactory = idFactory;
        this.clock = clock;
    }

    /**
     * Runs all configured validator stages and returns a completed,
     * immutable ValidationRun.
     *
     * @param {object} subject Object being validated.
     * @param {object} options Audit and execution context.
     */
    run(subject, options = {}) {
        ValidationRunner.assertSubject(subject);
        ValidationRunner.assertOptions(options);

        const ruleSets = this.ruleRegistry.getAll();
        const startedAt = this.clock();
        const run = new ValidationRun({
            validationRunId:
                options.validationRunId ?? this.idFactory(),
            ruleSetVersion:
                options.ruleSetVersion ??
                ValidationRunner.buildRuleSetVersion(ruleSets),
            configurationVersion:
                options.configurationVersion ??
                DEFAULT_CONFIGURATION_VERSION,
            objectType:
                options.objectType ??
                VALIDATION_OBJECT_TYPES.ATLAS_RECORD,
            objectId:
                options.objectId ?? ValidationRunner.resolveObjectId(subject),
            objectRevision:
                options.objectRevision ??
                ValidationRunner.resolveObjectRevision(subject),
            triggeredBy: options.triggeredBy ?? "sentinel:validation-runner",
            exceptionSetVersion: options.exceptionSetVersion ?? null,
            startedAt
        });

        const context = Object.freeze({
            ...options.context,
            validationRunId: run.validationRunId,
            objectType: run.objectType,
            extension: options.extension ?? null
        });

        this.executeStage({
            stageName: "CORE",
            validator: this.coreValidator,
            subject,
            ruleSets,
            context,
            run
        });

        this.executeStage({
            stageName: "EXTENSION",
            validator: this.extensionValidator,
            subject,
            ruleSets: ValidationRunner.selectExtensionRuleSets(
                ruleSets,
                options.extension
            ),
            context,
            run
        });

        const aggregation = this.decisionAggregator.aggregate(run);
        run.complete(aggregation.decision, this.clock());

        return run;
    }

    executeStage({
        stageName,
        validator,
        subject,
        ruleSets,
        context,
        run
    }) {
        if (!validator || ruleSets.length === 0) {
            return;
        }

        try {
            const output = validator.validate({
                subject,
                ruleSets,
                context
            });

            if (output instanceof Promise) {
                throw new TypeError(
                    `${stageName} validator returned a Promise; ValidationRunner.run() is synchronous.`
                );
            }

            for (const result of ValidationRunner.normalizeResults(
                output,
                stageName
            )) {
                run.addResult(result);
            }
        } catch (error) {
            run.addResult(
                ValidationRunner.createExecutionError(stageName, error)
            );
        }
    }

    static normalizeResults(output, stageName) {
        if (output === null || output === undefined) {
            return [];
        }

        const results = Array.isArray(output) ? output : [output];

        for (const result of results) {
            if (!(result instanceof ValidationResult)) {
                throw new TypeError(
                    `${stageName} validator must return ValidationResult instances.`
                );
            }
        }

        return results;
    }

    static createExecutionError(stageName, error) {
        const normalizedError = error instanceof Error
            ? error
            : new Error(String(error));

        return ValidationResult.error({
            ruleId: `${INTERNAL_ERROR_RULE_PREFIX}-${stageName}`,
            severity: VALIDATION_SEVERITIES.CRITICAL,
            failureCode: "VALIDATOR_EXECUTION_ERROR",
            message: `${stageName} validator execution failed.`,
            evidence: {
                errorName: normalizedError.name,
                errorMessage: normalizedError.message
            },
            forgeEffect: FORGE_EFFECTS.BLOCKED,
            remediation:
                "Inspect the validator implementation and rerun validation.",
            metadata: {
                stage: stageName,
                source: "ValidationRunner"
            }
        });
    }

    static selectExtensionRuleSets(ruleSets, extension) {
        if (!extension) {
            return ruleSets.filter((ruleSet) =>
                RuleRegistry.getExtensions(ruleSet).length > 0
            );
        }

        const normalized = extension.trim().toLowerCase();
        return ruleSets.filter((ruleSet) =>
            RuleRegistry.getExtensions(ruleSet)
                .some((value) => value.toLowerCase() === normalized)
        );
    }

    static buildRuleSetVersion(ruleSets) {
        if (ruleSets.length === 0) {
            return DEFAULT_RULE_SET_VERSION;
        }

        return ruleSets
            .map(({ id, version }) => `${id}@${version}`)
            .join("+");
    }

    static resolveObjectId(subject) {
        const id = subject.id ?? subject.objectId;

        if (typeof id === "string" && id.trim().length > 0) {
            return id.trim();
        }

        if (typeof id === "number" && Number.isFinite(id)) {
            return String(id);
        }

        throw new TypeError(
            "ValidationRunner requires options.objectId or a subject id."
        );
    }

    static resolveObjectRevision(subject) {
        return subject.revision ??
            subject.objectRevision ??
            subject.metadata?.revision ??
            1;
    }

    static createValidationRunId() {
        if (globalThis.crypto?.randomUUID) {
            return `val_${globalThis.crypto.randomUUID()}`;
        }

        return `val_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 10)}`;
    }

    static assertValidator(name, validator) {
        if (
            validator !== null &&
            (
                typeof validator !== "object" ||
                typeof validator.validate !== "function"
            )
        ) {
            throw new TypeError(
                `ValidationRunner ${name} must expose validate() or be null.`
            );
        }
    }

    static assertSubject(subject) {
        if (
            subject === null ||
            typeof subject !== "object" ||
            Array.isArray(subject)
        ) {
            throw new TypeError(
                "ValidationRunner subject must be an object."
            );
        }
    }

    static assertOptions(options) {
        if (
            options === null ||
            typeof options !== "object" ||
            Array.isArray(options)
        ) {
            throw new TypeError(
                "ValidationRunner options must be an object."
            );
        }

        if (
            options.context !== undefined &&
            (
                options.context === null ||
                typeof options.context !== "object" ||
                Array.isArray(options.context)
            )
        ) {
            throw new TypeError(
                "ValidationRunner options.context must be an object."
            );
        }

        if (
            options.extension !== undefined &&
            (
                typeof options.extension !== "string" ||
                options.extension.trim().length === 0
            )
        ) {
            throw new TypeError(
                "ValidationRunner options.extension must be a non-empty string."
            );
        }
    }
}

export default ValidationRunner;
