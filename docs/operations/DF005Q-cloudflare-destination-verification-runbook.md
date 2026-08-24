# DF005-Q Cloudflare destination-verification runbook

**Status:** Future operator procedure; no step is authorized or executed by DF005-Q.

**Secret handling:** THE API TOKEN MUST NOT BE SHARED IN CHAT. Do not paste it into ChatGPT, Codex, tickets, source files, command arguments, or `.env`. Perform credential entry locally through the DF005-T secure operator wrapper.

DF005-R now supplies controlled PREPARE/EXECUTE software, but production runtime configuration remains unavailable. The account-level destination operation does not require a Worker. Do not run EXECUTE until PREPARE can produce an authorization from the approved recipient, Cloudflare account identifier, and least-privilege API token.

## Preconditions

- Confirm the source-controlled approval is `OPERATOR_APPROVED` and production sending remains disabled.
- Obtain the approved destination from the operator through the approved secure channel. Do not copy it into source control, tickets, logs, diagnostics, browser configuration, or command history.
- Keep destination verification separate from later Worker, D1, email-binding, monitoring, sender/domain, and delivery approvals.

## A. Supply server-side runtime configuration

In the Cloudflare dashboard, obtain the account identifier from the account overview without copying it into project files or notes. Create a custom API token using the current token-management interface and grant only the account-level **Email Routing Addresses: Edit** permission corresponding to the documented `Email Routing Addresses Write` API permission family. Scope it to the intended account. Do not create or disclose these values during implementation or review.

Locally run `npm run gateway:alert-recipient:verification:operator`. The wrapper prompts without echo for the account ID, API token, and operator-approved recipient, passes them ephemerally to PREPARE, clears its environment, prints only redacted status and authorization metadata, and stops. It does not call Cloudflare. Runtime presence assesses as `PENDING_VERIFICATION`, not `VERIFIED`.

The non-interactive zero-value diagnostic is:

`npm run gateway:cloudflare:verification-credentials:status`

The secure wrapper performs the zero-network PREPARE. Review the resulting authorization before considering a separate execution command.

`npm run gateway:alert-recipient:verification:prepare`

Without injected values it must report the recipient, account identifier, and API token as not configured and create no authorization.

## B. Perform Cloudflare destination verification

In the Cloudflare dashboard, select the account, then **Compute → Email Service → Email Routing → Destination Addresses**. Add the same operator-approved destination. Cloudflare sends a verification message; the operator controlling that mailbox must open it and select **Verify email address**. Until this succeeds, the destination remains pending and no Gateway verification evidence may be recorded. See Cloudflare's [destination-address procedure](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/).

After a successful PREPARE and separate operator review, the controlled API equivalent is:

`npm run gateway:alert-recipient:verification:execute -- --authorization-id=<AUTHORIZATION_ID> --confirm=VERIFY-ALERT-RECIPIENT`

The command creates the account-level Email Routing destination request only. It does not deploy a Worker, configure a sender, or enable alert sending. Cloudflare's [destination-address API](https://developers.cloudflare.com/api/resources/email_routing/subresources/addresses/methods/create/) requires an account identifier and authorized API token supplied only at execution time.

## C. Observe and record governed evidence

After mailbox verification, DF005-U provides a separate GET-only observation command: `npm run gateway:alert-recipient:verification:observe`. It uses hidden local prompts, lists destination addresses, privately matches the approved recipient, writes only a digest-bound candidate, and performs no provider mutation. Do not run it from chat or expose the token.

Review the candidate, then admit it separately with `npm run gateway:alert-recipient:verification:evidence:admit -- -ObservedBy operator:<label>`. Admission performs no network request. It is replay-safe and leaves provider deployment and sending disabled.

After the dashboard reports the exact destination as verified, capture only the opaque destination reference and Cloudflare-reported verification time through the future secure evidence repository. Bind that evidence to the server-side configured address and `BEACON_ALERT_RECIPIENT`. Do not retain the verification email, token, account identifier, API response, or unrelated provider payload. A missing `verified` time means verification has not occurred. DF005-Q defines the validator but creates no production evidence repository or record.

The execution result `VERIFICATION_EMAIL_REQUESTED` is not verification evidence and must never be converted into `VERIFIED`. A failed reserved execution receives no automatic retry; prepare a new authorization only after operator review of provider state.

## D. Configure provider and sender/domain separately

DF005-W provides the local approval/PREPARE boundary while leaving the sender and binding undeployed. Do not reuse the recipient as sender by inference. When the operator is ready to create review material, run `npm run gateway:alert-sender-domain:onboarding:prepare`. Its PowerShell wrapper prompts invisibly for the exact sender, requests explicit approval of the `cheapestram.com` domain proposal, inventories and acknowledges Bounce/MX, SPF, DKIM, DMARC, and other provider-required DNS impact, and separately offers approval of the proposed `BEACON_ALERT_EMAIL` binding name. It stores only digests and an opaque authorization ID under `.forge-review`.

Cloudflare Email Sending onboarding may create managed bounce MX, SPF, DKIM, and DMARC records. That is an external DNS/provider mutation and remains outside DF005-W. PREPARE records DNS-impact review but explicitly sets DNS mutation approval and execution to false. There is no onboarding EXECUTE command in DF005-W.

Email sending requires separate domain onboarding and DNS validation under **Compute → Email Service → Email Sending**. The sender must belong to an onboarded Email Service domain. Do not infer a sender from the recipient or domain name. A `PREPARED` DF005-W authorization permits review only; do not follow Cloudflare's [domain configuration procedure](https://developers.cloudflare.com/email-service/configuration/domains/) until a later increment supplies a separately reviewed mutation authorization.

## E. Configure deployment and enable sending separately

After verification and sender/domain approval, configure one Workers `send_email` binding restricted with `destination_address` to the verified destination. Keep the address-bearing deployment configuration outside committed/public artifacts. Cloudflare documents the restriction in [Configure send bindings](https://developers.cloudflare.com/email-service/configuration/send-bindings/). Provider deployment, controlled delivery testing, and production sending each require separate approval; none is implied by verification.
