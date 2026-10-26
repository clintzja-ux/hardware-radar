# IC-DF006A — Beacon Serialized Projection Pointer Coordinator

## Certified boundary

The Beacon release-bound projection pointer has one Durable Object-compatible single-writer owner. Durable Object transactional storage is authoritative for pointer order; Workers KV is only the eventually consistent delivery projection consumed by the Worker. The owner has no release, publication, Mercury, destination, Current, History, analytics-activation, or deployment authority.

The pointer binds an exact positive release generation, production release ID, envelope digest, immutable envelope key, and the exact immediately preceding pointer summary. Advancement requires compare-and-set agreement with durable state. Generations may advance only monotonically; same-generation differences conflict, older generations are stale, exact duplicates are idempotent, and a new pointer must identify the current pointer as its predecessor.

## Interruption and consistency

The Durable Object transaction commits the authoritative pointer before publishing the read projection to KV. If KV publication fails after that commit, the caller receives failure and no later release may regress the durable pointer. Replaying the exact request returns `UNCHANGED` and republishes the same pointer, completing recovery without duplicate authority or envelope creation.

The B5-A delivery owner still writes and verifies the immutable envelope before asking this owner to advance. The Worker never treats KV as linearizable: it verifies the digest-addressed envelope and may use only the pointer's immediately previous, still-fresh envelope while the new immutable value is not yet visible. Missing, altered, or expired evidence fails closed for collection and never affects retailer navigation.

The Durable Object is reachable only through an internal namespace binding. No public HTTP route, Cloudflare resource, binding, migration, or production delivery is created by this increment.
