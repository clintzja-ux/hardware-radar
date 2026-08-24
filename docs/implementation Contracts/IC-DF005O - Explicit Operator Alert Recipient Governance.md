# IC-DF005O — Explicit Operator Alert Recipient Governance

Configuration `beacon_gateway_operator_alert_recipient_v1` governs exactly one future `EMAIL` destination for security and operational-health alerts. Production explicitly stores `recipientAddress: null`, `verificationState: NOT_CONFIGURED`, and `enabled: false`; no address is invented or discovered.

Allowed verification states are `NOT_CONFIGURED`, `PENDING_VERIFICATION`, `VERIFIED`, `VERIFICATION_FAILED`, and `REVOKED`. Cloudflare email-destination verification is the authority. An address alone never implies verification. A `VERIFIED` fixture requires a syntactically valid single address, a non-empty verification-evidence reference, and enabled state. Lists, display names, multiple addresses, browser/request fields, arbitrary destinations, and unknown states fail closed.

The source-controlled production record contains no personal address. Future real configuration must be supplied server-side through the same strict repository boundary after an approved secure configuration mechanism exists. It cannot derive from Git identity, environment/request metadata, Beacon, monitoring, Atlas, or browser input.

The `send_email` binding remains `EXPLICIT_DESTINATION_ONLY`; notification objects have no recipient, CC, BCC, reply-to, sender, or binding override authority. Missing production configuration returns `RECIPIENT_NOT_CONFIGURED`; pending, failed, or revoked verification returns `RECIPIENT_NOT_VERIFIED`. Controlled results never expose the address.

Readiness exposes recipient governance available while production configured and verified states remain false. Sender/domain, provider deployment, and sending remain false. Production transport stays `NOT_CONNECTED`; no verification request, email, Cloudflare call, DNS change, browser connection, or spend occurs.

DF005-P implements the approved secure input boundary. `BEACON_ALERT_RECIPIENT` may be supplied only through explicitly extracted server-side Worker runtime configuration. A present valid value projects this unchanged governance model to `PENDING_VERIFICATION`, never `VERIFIED`; production still supplies no value. The runtime adapter does not redefine verification authority, provider, channel, binding restriction, retry, remediation, or sending authority.

DF005-Q records operator approval outside this resolution state and defines the controlled evidence path. Approval alone leaves this model `NOT_CONFIGURED`; runtime presence alone produces `PENDING_VERIFICATION`. Only matching validated Cloudflare destination evidence may produce `VERIFIED`, while `emailSendingEnabled` remains false.
