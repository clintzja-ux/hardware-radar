Engineering Session 002

Title: Atlas Core Schema Implementation

Deliverables:

✅ atlas-core-product.schema.json
✅ Review every field against the Core Product Model
✅ Separate Core vs. RAM Extension ownership
✅ Ensure zero duplicated definitions
✅ Produce a migration checklist for the existing RAM schema

I don't want to modify the RAM schema until the Core schema is finalized. That keeps the migration controlled and avoids chasing changes in two places at once.

I also intend to review every field individually against the new constitutional documents rather than simply copying them over. That will let us identify fields that should be derived, moved, or owned by a different subsystem before they become part of the long-term API.