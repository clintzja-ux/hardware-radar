# IC-RAKUTEN-NEWEGG-FRESH-FULL-CURRENT-REFRESH-P1

Status: IMPLEMENTED / FIXTURE-CERTIFIED / OPERATOR-AUTHORIZED CURRENT EXECUTED / ZERO-AUTHORITY PUBLIC CANDIDATE CERTIFIED

Rakuten main-family FULL files are complete Newegg Product Catalog observations. For a newly validated FULL, every exact Hardware Radar-bound record is a fresh Current observation at the validated HDR time even when price and availability are unchanged. DELTA remains an intra-cycle I/U/D change feed; absence from DELTA never refreshes an offer.

The exact family `RAKUTEN_MAIN:44583:4746097` uses strict `DD/MM/YYYY HH:mm:ss` UTC HDR parsing. Remote SFTP mtime is retained only for change detection. Payload SHA-256 identifies retrieved bytes, and the disk-backed catalog state ID/digest identifies deterministic derived lineage. Rakuten documentation's Product Field 3 is parser index 2 because documentation is one-based and parser arrays are zero-based; this is the Newegg Item/SKU identity.

The production path downloads an exact root-main FULL through one leased, pinned-host SFTP session, closes the network before streaming validation, materializes the million-record state in the existing SQLite catalog owner, and extracts only canonical Newegg destination SKUs with one set-based query. No whole-catalog heap collection is permitted.

Exact canonical destination/listing matches enter the shared Current adapter and schema-1.1 orchestrator. A single legacy product/channel predecessor with the same product, retailer, and destination progresses deterministically to its evidence-grounded listing identity; it does not coexist as a duplicate. Distinct canonical listings remain distinct offers. Ambiguous mappings, same-offer source conflicts, contrary condition evidence, invalid price/currency, unsupported availability, invalid destination, or rights failure remain fail closed.

Main-feed membership does not prove seller. Seller remains `UNKNOWN` unless separately established. Contextual `NEW` uses `RAKUTEN-NEWEGG-CONTEXTUAL-RETAIL-CONDITION-P1-1.0`; credible contrary evidence wins. Canonical RetailerDestination remains action authority, including existing governed affiliate precedence. Rakuten URLs do not replace it.

Rakuten remains History-ineligible. FULL and DELTA create zero Mercury History or chronology records. The immutable plan binds the source Current snapshot/fingerprint, FULL digest/HDR, catalog state/digest, exact qualification results, and proposed schema-1.1 diff. Its preparation has `authority=NONE`, `currentMutationAuthorized=false`, and no network, provider, publication, release, or deployment authority.

Initial operating target: retrieve a new FULL approximately every 24 hours under the existing 36-hour Current TTL, leaving about 12 hours of operational recovery margin. DELTA is optional between FULL cycles. Scheduling is not implemented by this increment.

The operator-authorized execution is exact-scope and atomic. It validates the immutable plan and PREPARE digests, source snapshot/fingerprint, FULL and catalog lineage, exact confirmation, and all 58 predecessor offers before replacing canonical Current. Target-state replay returns `ALREADY_EXECUTED`. The resulting snapshot is `mer_display_3724ab4068bcac762a876ee7`: 189 offers, 58 updated, zero added/withdrawn, and 131 unchanged. History, destinations, affiliate evidence, and the manual workbook remain unchanged.

Complete QA is a deterministic ignored CSV projection of all 58 refreshed Newegg offers, never a machine-selected sample. Its previous-price and movement fields derive from immutable PREPARE predecessors so replay is byte-identical. The public compatibility projection preserves the uniquely matching already-published offer when both distinct schema-1.1 identities were also present in the immediate Current predecessor; this is continuity, not a new multi-offer winner rule, and ambiguity still fails closed.
