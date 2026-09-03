# IC-DATAFORSEO-004C — Governed Execution → DF003 Integration

## Status
Implementation candidate.

## Contract
A successful paid acquisition is not equivalent to accepted market evidence. DF004-C connects an approved DF004 execution result to DF003 normalization, identity evaluation, and durable evidence retention while preserving separate acquisition and evidence outcomes.

## Invariants
- Only provider work approved by DF004-A and executed by DF004-B may enter this bridge.
- Provider-reported cost remains authoritative even when downstream evidence is rejected.
- Evidence normalization failure never triggers an automatic paid retry.
- DF003 identity gates remain authoritative.
- PROBABLE product plus DISCOVERED merchant evidence may be retained but is not historically eligible.
- No canonical promotion or publication occurs in DF004-C.
- Affiliate relationships are irrelevant to evidence retention and identity decisions.

## DF004-C is certified.

Mercury    108/108 PASS
Atlas       15/15 PASS
Sentinel     7/7 PASS
Forge       PASS
Site        PASS
Console     CLEAN


DF004-A     CERTIFIED
DF004-B     CERTIFIED
DF004-C     CERTIFIED