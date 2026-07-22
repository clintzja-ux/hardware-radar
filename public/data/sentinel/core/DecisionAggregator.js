import ValidationRun, {
    SENTINEL_DECISIONS
} from "../types/ValidationRun.js";
import {
    VALIDATION_RESULTS,
    VALIDATION_SEVERITIES
} from "../types/ValidationResult.js";

const FAILURE_RESULTS = new Set([
    VALIDATION_RESULTS.FAIL,
    VALIDATION_RESULTS.ERROR
]);

const BLOCKING_SEVERITIES = new Set([
    VALIDATION_SEVERITIES.CRITICAL,
    VALIDATION_SEVERITIES.HIGH
]);

const REVIEW_SEVERITIES = new Set([
    VALIDATION_SEVERITIES.MEDIUM
]);

const WARNING_SEVERITIES = new Set([
    VALIDATION_SEVERITIES.LOW,
    VALIDATION_SEVERITIES.INFO
]);

/**
 * Converts the canonical results contained by a ValidationRun into the
 * deterministic workflow decision Sentinel returns to Forge.
 *
 * DecisionAggregator is intentionally pure: it performs no I/O and does not
 * mutate the ValidationRun or any ValidationResult instance.
 */
export class DecisionAggregator {
    /**
     * Aggregates a ValidationRun without modifying or completing it.
     * ValidationRunner is responsible for applying the returned decision to
     * the run after aggregation.
     */
    aggregate(validationRun) {
        DecisionAggregator.assertValidationRun(validationRun);

        const results = validationRun.getResults();
        const summary = this.buildSummary(results);
        const blockingRuleIds = this.getBlockingRules(results);
        const reviewRuleIds = this.getReviewRules(results);
        const warningRuleIds = this.getWarningRules(results);
        const decision = this.determineDecision({
            blockingRuleIds,
            reviewRuleIds,
            warningRuleIds
        });

        return DecisionAggregator.freezeDecision({
            decision,
            validationRunId: validationRun.validationRunId,
            ruleSetVersion: validationRun.ruleSetVersion,
            summary,
            blockingRuleIds,
            reviewRuleIds,
            warningRuleIds
        });
    }

    /**
     * Builds the compact Forge decision summary defined by the Sentinel Rule
     * Specification. FAIL and ERROR results are grouped by severity, while
     * warnings represent explicit WARN results.
     */
    buildSummary(results) {
        DecisionAggregator.assertResults(results);

        const summary = {
            totalResults: results.length,
            criticalFailures: 0,
            highFailures: 0,
            mediumFailures: 0,
            lowFailures: 0,
            infoFailures: 0,
            warnings: 0,
            passes: 0,
            notApplicable: 0
        };

        for (const result of results) {
            if (result.result === VALIDATION_RESULTS.PASS) {
                summary.passes += 1;
                continue;
            }

            if (result.result === VALIDATION_RESULTS.NOT_APPLICABLE) {
                summary.notApplicable += 1;
                continue;
            }

            if (result.result === VALIDATION_RESULTS.WARN) {
                summary.warnings += 1;
                continue;
            }

            if (!FAILURE_RESULTS.has(result.result)) {
                throw new Error(
                    `Unsupported validation result: ${result.result}.`
                );
            }

            switch (result.severity) {
                case VALIDATION_SEVERITIES.CRITICAL:
                    summary.criticalFailures += 1;
                    break;
                case VALIDATION_SEVERITIES.HIGH:
                    summary.highFailures += 1;
                    break;
                case VALIDATION_SEVERITIES.MEDIUM:
                    summary.mediumFailures += 1;
                    break;
                case VALIDATION_SEVERITIES.LOW:
                    summary.lowFailures += 1;
                    break;
                case VALIDATION_SEVERITIES.INFO:
                    summary.infoFailures += 1;
                    break;
                default:
                    throw new Error(
                        `Unsupported validation severity: ${result.severity}.`
                    );
            }
        }

        return Object.freeze(summary);
    }

    getBlockingRules(results) {
        return this.getRuleIds(results, (result) =>
            FAILURE_RESULTS.has(result.result) &&
            BLOCKING_SEVERITIES.has(result.severity)
        );
    }

    getReviewRules(results) {
        return this.getRuleIds(results, (result) =>
            FAILURE_RESULTS.has(result.result) &&
            REVIEW_SEVERITIES.has(result.severity)
        );
    }

    getWarningRules(results) {
        return this.getRuleIds(results, (result) =>
            result.result === VALIDATION_RESULTS.WARN ||
            (
                FAILURE_RESULTS.has(result.result) &&
                WARNING_SEVERITIES.has(result.severity)
            )
        );
    }

    determineDecision({
        blockingRuleIds,
        reviewRuleIds,
        warningRuleIds
    }) {
        if (blockingRuleIds.length > 0) {
            return SENTINEL_DECISIONS.BLOCKED;
        }

        if (reviewRuleIds.length > 0) {
            return SENTINEL_DECISIONS.REVIEW;
        }

        if (warningRuleIds.length > 0) {
            return SENTINEL_DECISIONS.READY_WITH_WARNINGS;
        }

        return SENTINEL_DECISIONS.READY;
    }

    getRuleIds(results, predicate) {
        DecisionAggregator.assertResults(results);

        const ruleIds = results
            .filter(predicate)
            .map(({ ruleId }) => ruleId);

        return Object.freeze(ruleIds);
    }

    static assertValidationRun(validationRun) {
        if (!(validationRun instanceof ValidationRun)) {
            throw new TypeError(
                "DecisionAggregator requires a ValidationRun instance."
            );
        }
    }

    static assertResults(results) {
        if (!Array.isArray(results)) {
            throw new TypeError(
                "DecisionAggregator results must be an array."
            );
        }
    }

    static freezeDecision({
        decision,
        validationRunId,
        ruleSetVersion,
        summary,
        blockingRuleIds,
        reviewRuleIds,
        warningRuleIds
    }) {
        return Object.freeze({
            decision,
            validationRunId,
            ruleSetVersion,
            summary,
            blockingRuleIds,
            reviewRuleIds,
            warningRuleIds
        });
    }
}

export default DecisionAggregator;
