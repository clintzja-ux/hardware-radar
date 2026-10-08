# IC — Newegg retained-observation History admission execute P1

## Exact authority

Execution is limited to plan `mer_rethistplan_fef29f43af588df20dfbd538`, binding `fef29f43af588df20dfbd538d6ab7c64a9eba610e46b76f42c2125b29a945db8`, preparation `mer_rethistprep_1c685ecdfb4843bc5d699b32`, binding `1c685ecdfb4843bc5d699b3231aefc1b6014512afb42b676bd0365c561321aff`, and its 326 observations. No recomputation or substitution is permitted under that authority.

## Atomicity and replay

`FileHistoricalObservationRepository.acceptBatch` validates the complete cohort before one atomic file replacement. Any pre-existing subset fails closed. Exact completed replay returns `ALREADY_EXECUTED`; it cannot append records or advance sequence. Repository sequence remains append-only while retained provider HDR remains the market chronology.

## Revalidation

Execution revalidates the source History byte hash and sequence, immutable plan and preparation bindings, current rights digest and certified History/analytics permissions, all three retained artifact SHA-256 digests, event types and HDRs, and every candidate identity. No provider acquisition occurs.

## Projection compatibility

Terminal and public chronology accept the generic `RETAINED_COMMERCE_FEED` lineage after canonical admission. This is additive source recognition under already-certified rights; it does not grant Current, publication, release, ranking, or destination authority.

## Separation

History admission does not mutate Current, Atlas, destinations, affiliate evidence, workbook evidence, or release state. Any RAM portfolio recomposition remains zero-authority until separately released.
