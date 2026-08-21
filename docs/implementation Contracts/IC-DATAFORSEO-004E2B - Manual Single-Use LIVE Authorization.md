# IC-DATAFORSEO-004E2B — Manual Single-Use LIVE Authorization

## PREPARE
`npm run acquisition:live:prepare` builds the current canonical plan, requires exactly one approved task at no more than $0.001, writes `.forge-review/acquisition/live-authorization-request.json`, and performs no API request.

## EXECUTE
Execution is intentionally separate. It requires the exact exported request ID and `--confirm=SPEND-0.001`. Authorization is bound to the plan, expires after 15 minutes, is consumed durably before transport, allows one PRODUCTS task, and cannot be replayed. Automatic paid retries remain zero. E2B does not authorize Windows Task Scheduler for LIVE operation.

## E2B live-execution quality gate

I would therefore record the current status as:

DF004-E2B


Manual preparation                 PASS
Zero-cost PREPARE                   PASS
Explicit operator approval         PASS
Exact plan binding                 PASS
Single-use authorization           PASS
$0.001 ceiling                     PASS
One-task ceiling                   PASS
Zero automatic retries             PASS
Production DataForSEO execution    PASS
Provider task creation             PASS
Execution ledger                   PASS
Task ledger                        PASS
Authorization consumption          PASS
Provider billing reconciliation    PASS


LIVE ACQUISITION BOUNDARY          CERTIFIED


Evidence integration               NOT YET TESTED

## manual single-use LIVE acquisition boundary itself:

DF004-E2B


PREPARE                          PASS
Explicit operator authorization PASS
Single-use consumption          PASS
Plan binding                    PASS
1-task ceiling                  PASS
$0.001 ceiling                  PASS
Zero automatic retries          PASS
Provider task creation          PASS
Billing reconciliation          PASS
Result retrieval                PASS
Unexpected spend                NONE


MANUAL LIVE ACQUISITION         CERTIFIED