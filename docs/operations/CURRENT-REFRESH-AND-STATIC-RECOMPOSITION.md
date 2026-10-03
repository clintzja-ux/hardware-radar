# Current refresh and static recomposition

Run PREPARE and INSPECT at least twice daily. The operation is read-only with respect to providers and canonical market state.

```powershell
npm run retail-current:refresh:prepare -- --as-of=<UTC_ISO_TIMESTAMP> --maximum-members=50
npm run retail-current:refresh:inspect -- --plan-id=<PLAN_ID>
```

Review products losing all Current first, then one retailer, then stale/uncovered coverage. Review destination and identity exceptions rather than substituting products or sources. A prepared plan grants no authority to call a provider or spend.

After separately governed source execution, reuse existing Current qualification, History retention, source-conflict and manual-review owners. Recompose with the existing RAM intelligence portfolio operation, certify with Sentinel, and retain explicit production deployment approval.

If fresh Current cannot be safely deployed before expiry, prepare and deploy the certified durable-History/empty-Current portfolio rather than knowingly leaving stale prices live.
