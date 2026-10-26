# IC-DF005Z — Beacon Release-Bound Destination Projection

## Ownership and provenance

Mercury remains the owner of the governed public Current retailer projection. Sentinel and the existing publication owners remain the owners of candidate certification, production release acceptance, predecessor lineage, and deployed Git identity. Beacon receives no release, publication, destination, Current, or History authority.

Schema `1.0` `BEACON_RELEASE_BOUND_PUBLIC_DESTINATION_PROJECTION` binds the exact public projection to a production release generation, release, candidate, artifact, Sentinel certification, predecessor release, production Git commit, Current projection SHA-256, release-artifact SHA-256, observation time, and unchanged validity deadline. An acceptance binding digest covers the immutable release facts. The contract accepts only an `ON` production RAM portfolio release whose artifact and certification validate through the existing canonical owners and whose durable publication evidence is terminal `LIVE_ACCEPTED` before the original Current deadline.

## Delivery and KV consistency

Delivery is disabled by default. A delivery owner may write a digest-addressed immutable envelope, read it back, and request advancement of a `current` pointer only after verification. The pointer retains the immediately preceding immutable key so readers may fall back when an eventually consistent KV read exposes the pointer before the new value, but only while that predecessor remains valid.

Workers KV does not provide a globally atomic compare-and-set operation. Production delivery therefore requires a separate single-writer `ReleaseBoundProjectionPointerCoordinator` implementing `compareAndSet`; a Durable Object or an equivalently serialized D1 owner is suitable. The repository intentionally provides no unsafe KV-only pointer writer. Until that owner is selected, provisioned, and certified, production delivery remains disabled.

The Worker resolves only server-side pointer and envelope records, verifies their digests, generation, release binding, exact public projection, and freshness, and then passes the projection to the existing destination validator. Missing, conflicting, stale, or temporarily unavailable evidence returns a failure-safe analytics response. Retailer navigation remains independent.

No Cloudflare resource, route, migration, collection activation, publication operation, or canonical market mutation is authorized by this contract.
