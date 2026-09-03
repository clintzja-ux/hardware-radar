# IC-DATAFORSEO-004E2I.2 — Identity Review Audit Remediation

## Objective

Remediate a defective placeholder reviewer identity without editing, deleting, or replacing the original append-only E2I decision.

## Contract

New product and merchant approvals reject blank reviewers and angle-bracket template values such as `<YOUR_OPERATOR_LABEL>` and `<REVIEWED_BY>`.

Legacy decisions with defective reviewers remain readable audit evidence but are ineffective for identity projection. A reviewer correction requires an explicit `REMEDIATE-IDENTITY-REVIEW-AUDIT` action and creates a separate `mer_idrem_*` record containing the original decision ID and hash, subject, original and corrected reviewers, remediation operator/time/reason, and the unchanged supporting evidence relationship.

Only an approved, contradiction-free decision with its original transition and current evidence binding may be remediated. Exact replay returns the existing remediation; changed reviewer, operator, reason, subject, evidence, or decision binding fails closed.

## Effective projection

An approval is effective when its reviewer is intrinsically valid or when one valid, bound remediation corrects its defective reviewer. Projection never rewrites the decision, retained evidence, Atlas, or another identity subject. Remediation does not authorize promotion; E2G/E2H reassessment remains separate.

## Command

`npm run review:identity:audit-remediate -- --decision-id=<id> --confirm=REMEDIATE-IDENTITY-REVIEW-AUDIT --reviewed-by=<actual-operator> --reason=<human-reason>`

The command is local, creates no paid task, performs no acquisition, and spends `$0.000`.
