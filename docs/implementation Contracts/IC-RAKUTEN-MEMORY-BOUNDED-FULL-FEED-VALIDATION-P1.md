# IC-RAKUTEN-MEMORY-BOUNDED-FULL-FEED-VALIDATION-P1

Status: implemented and locally certified; no provider retry authorized.

## Failure and correction

The first Rakuten Current canary discovery transferred the authoritative FULL into a temporary file and closed the network session, but local validation then loaded the complete 156,857,061-byte gzip Buffer, retained approximately 1.07 million expanded 38-field record objects, constructed additional filtered arrays, and retained another byte reference in the authoritative-sequence result. Node exhausted its default heap before validation could finalize. Transfer success therefore did not become validation success or governed evidence.

The transport now validates staged files through a file stream. Gzip decompression, physical-record framing, schema validation, timestamp parsing, row validation, trailer/count verification, modification counts, field-count collection, and SHA-256 hashing are incremental. The validator can retain no full record corpus and can optionally retain only explicitly requested SKU records. Existing callers retain the legacy collected-record behavior by default; transport uses bounded mode. Catalog projection semantics remain unchanged.

## States and atomicity

Operational states are `DOWNLOADING`, `TRANSFERRED_UNVALIDATED`, `VALIDATING`, and `VALIDATED`; failures remain temporary/diagnostic and never become canonical catalog evidence. Final filenames are created only after every file in an authoritative FULL-plus-DELTA lineage validates. A validation failure removes ordinary temporary files, preserves the preceding canonical state, and grants no Current, History, destination, affiliate, publication, or release authority.

The OOM-abandoned `.partial-*` file is diagnostic material only. Local streaming inspection established that its gzip/trailer structure is complete, but its partial filename and failed acquisition lineage remain authoritative: it is not admitted provider evidence and must not be renamed or promoted. Existing stale-partial inspection is the retention mechanism; cleanup requires a separate deliberate operator action.

## Certification

A deterministic 100,000-row synthetic FULL validates with no retained record corpus, bounded target extraction, exact trailer/count semantics, and under a 256 MiB heap-growth acceptance bound. The observed test heap delta was approximately 1 MiB. The 156,857,061-byte diagnostic partial validated locally under a 1 GiB Node heap with 1,059,018 rows, peak RSS approximately 201 MiB, final heap approximately 36.5 MiB, and approximately 39.4 seconds elapsed. Large missing-trailer input fails closed after all product rows; gzip corruption, schema failures, and existing catalog duplicate semantics remain covered by the Rakuten suites.

No Rakuten/DataForSEO call, retry, Current/History mutation, destination/affiliate change, publication, release, or deployment occurred. A new single-session provider attempt requires separate explicit operator authorization.
