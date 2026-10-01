# IC-MERCURY-ACTIVATION-002F — DataForSEO System-CA Transport Hardening and Nested Failure Diagnostics

Status: implemented and fixture-certified
Owner: Mercury DataForSEO operator runtime composition and acquisition failure diagnostics
Provider spend authority: none

## Transport policy

All repository-owned npm commands that perform DataForSEO HTTPS operations run Node with `--use-system-ca`. This applies consistently to PRODUCTS execution, PRODUCTS-result retrieval for Product Info preparation, Product Info execution and result retrieval, Sellers execution and result retention, and historical-refresh execution/retrieval. Zero-network PREPARE and inspection commands remain unchanged.

The policy addresses the confirmed Windows 10 / Node 24 trust-store mismatch in which DNS and TCP/443 succeeded, Windows trusted the provider certificate chain, default Node reported `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, and Node with system CA established validated TLS 1.3 and an HTTP exchange. It does not change credentials, Authorization construction, endpoints, request serialization, source rights, or spend authority.

Certificate validation remains mandatory. `NODE_TLS_REJECT_UNAUTHORIZED=0`, `rejectUnauthorized=false`, insecure command flags, custom certificate acceptance, and equivalent bypasses are prohibited.

## Diagnostic policy

`AcquisitionFailureDiagnostic` traverses at most four error/cause layers and stops on cycles. It extracts only bounded, redacted name, code, and message fields. Arbitrary exception objects, stacks, headers, environment state, and credentials are not serialized.

Recognized nested certificate codes project `TLS_CERTIFICATE_VALIDATION_FAILURE`; DNS/socket/runtime network codes project `NETWORK_FAILURE`. Both require fresh operator action before retry. The safe nested code becomes the diagnostic code and participates in the deterministic diagnostic fingerprint.

Existing Corsair and Crucial failed execution records remain immutable. The later zero-cost diagnosis established their shared system-CA transport cause but does not rewrite the historically limited durable diagnostics.

## Command inventory

The certified network-capable commands are:

- `acquisition:live:execute`
- `acquisition:enrichment:prepare`
- `acquisition:enrichment:live:execute`
- `acquisition:sellers:prepare`
- `acquisition:sellers:live:execute`
- `acquisition:sellers:retain`
- `acquisition:history-refresh:live:execute`
- `acquisition:history-refresh:result:retrieve`

This increment posts no task, creates no authorization, performs no result retrieval, and incurs no provider spend.
