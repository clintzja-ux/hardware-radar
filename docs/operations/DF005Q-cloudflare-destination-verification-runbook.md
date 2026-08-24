# DF005-Q Cloudflare destination-verification runbook

**Status:** Future operator procedure; no step is authorized or executed by DF005-Q.

## Preconditions

- Confirm the source-controlled approval is `OPERATOR_APPROVED` and production sending remains disabled.
- Obtain the approved destination from the operator through the approved secure channel. Do not copy it into source control, tickets, logs, diagnostics, browser configuration, or command history.
- Do not proceed until a deployable Worker composition root and secure deployment configuration have been separately approved.

## A. Supply server-side runtime configuration

Supply `BEACON_ALERT_RECIPIENT=<OPERATOR_APPROVED_ADDRESS>` through the approved Cloudflare Worker server-side secret-compatible deployment mechanism. Pass only that extracted binding to Gateway. Do not use public browser configuration or a committed Wrangler `vars` value. Runtime presence must assess as `PENDING_VERIFICATION`, not `VERIFIED`.

## B. Perform Cloudflare destination verification

In the Cloudflare dashboard, select the account, then **Compute → Email Service → Email Routing → Destination Addresses**. Add the same operator-approved destination. Cloudflare sends a verification message; the operator controlling that mailbox must open it and select **Verify email address**. Until this succeeds, the destination remains pending and no Gateway verification evidence may be recorded. See Cloudflare's [destination-address procedure](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/).

## C. Record governed evidence

After the dashboard reports the exact destination as verified, capture only the opaque destination reference and Cloudflare-reported verification time through the future secure evidence repository. Bind that evidence to the server-side configured address and `BEACON_ALERT_RECIPIENT`. Do not retain the verification email, token, account identifier, API response, or unrelated provider payload. A missing `verified` time means verification has not occurred. DF005-Q defines the validator but creates no production evidence repository or record.

## D. Configure provider and sender/domain separately

Email sending requires separate domain onboarding and DNS validation under **Compute → Email Service → Email Sending**. The sender must belong to an onboarded Email Service domain. Do not infer a sender from the recipient or domain name. Follow Cloudflare's [domain configuration procedure](https://developers.cloudflare.com/email-service/configuration/domains/) only after a separate authorization.

## E. Configure deployment and enable sending separately

After verification and sender/domain approval, configure one Workers `send_email` binding restricted with `destination_address` to the verified destination. Keep the address-bearing deployment configuration outside committed/public artifacts. Cloudflare documents the restriction in [Configure send bindings](https://developers.cloudflare.com/email-service/configuration/send-bindings/). Provider deployment, controlled delivery testing, and production sending each require separate approval; none is implied by verification.
