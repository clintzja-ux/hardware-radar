# IC-DF005T — Minimum Cloudflare Verification Credential Provisioning Boundary

DF005-T provides a local, ephemeral operator-input path for the three DF005-S verification prerequisites: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and `BEACON_ALERT_RECIPIENT`. It does not create credentials, access Cloudflare, or execute destination verification.

## Input and privacy

`GatewayCloudflareVerificationOperatorInput` accepts only the three certified keys and delegates validation to DF005-S. Private fields retain values; JSON serialization, structured cloning, inspection, readiness output, and diagnostics expose only sources and presence states. Account ID is a non-public identifier, the API token is secret, and the recipient is private server-side configuration.

The Windows operator wrapper uses hidden `Read-Host -AsSecureString` prompts, supplies values to one child PREPARE process through ephemeral environment entries, and removes those entries in `finally`. Token command-line arguments, `.env`, committed configuration, authorization plaintext, public/browser configuration, and chat sharing are prohibited.

## PREPARE and EXECUTE

PREPARE remains zero-network. Its version 1.1 short-lived authorization binds the approval, provider, authority, operation, recipient digest, and account-identifier digest. It stores neither plaintext value nor any token representation. Recipient or account substitution fails closed.

EXECUTE remains a distinct command requiring `--authorization-id` and exact `--confirm=VERIFY-ALERT-RECIPIENT`. Confirmation and authorization lookup precede ephemeral secret acquisition; binding validation precedes provider-client construction. Single use and no automatic retry remain unchanged.

DF005-T does not run PREPARE or EXECUTE, request a verification email, verify a recipient, send an alert, deploy a Worker/D1/WAF/email binding, connect browser transport, or spend money. Production remains `RUNTIME_SELECTED`, `NOT_CONNECTED`, and email sending remains disabled.
