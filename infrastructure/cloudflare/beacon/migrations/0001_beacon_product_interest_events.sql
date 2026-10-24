CREATE TABLE beacon_product_interest_events (
  event_id TEXT PRIMARY KEY NOT NULL,
  event_schema_version TEXT NOT NULL CHECK (event_schema_version IN ('1.0', '1.1')),
  signal_id TEXT NOT NULL UNIQUE,
  material_fingerprint TEXT NOT NULL CHECK (length(material_fingerprint) = 64),
  atlas_product_id TEXT NOT NULL,
  retailer_id TEXT NOT NULL CHECK (retailer_id GLOB 'RETAILER-[0-9][0-9][0-9][0-9]'),
  signal_type TEXT NOT NULL CHECK (signal_type = 'OUTBOUND_RETAILER_CLICK'),
  source TEXT NOT NULL CHECK (source = 'HARDWARE_RADAR_FIRST_PARTY'),
  destination_id TEXT,
  catalog_category TEXT,
  placement TEXT,
  source_surface TEXT,
  occurred_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  value REAL NOT NULL CHECK (value >= 0),
  unit TEXT NOT NULL,
  evidence_kind TEXT NOT NULL CHECK (evidence_kind = 'RAW'),
  event_json TEXT NOT NULL CHECK (json_valid(event_json)),
  signal_json TEXT NOT NULL CHECK (json_valid(signal_json)),
  CHECK (
    (event_schema_version = '1.0' AND source_surface IS NOT NULL AND destination_id IS NULL AND catalog_category IS NULL AND placement IS NULL)
    OR
    (event_schema_version = '1.1' AND source_surface IS NULL AND substr(destination_id, 1, 9) = 'mer_dest_' AND length(destination_id) = 33 AND substr(destination_id, 10) NOT GLOB '*[^0-9a-f]*' AND catalog_category IN ('DDR4', 'DDR5', 'SO_DIMM', 'OVERALL') AND placement IN ('HERO', 'CATALOG_CARD', 'PRODUCT_DETAIL'))
  )
) STRICT;

CREATE INDEX beacon_product_interest_events_product_time
  ON beacon_product_interest_events (atlas_product_id, occurred_at, event_id);

CREATE INDEX beacon_product_interest_events_recorded_time
  ON beacon_product_interest_events (recorded_at, event_id);

CREATE INDEX beacon_product_interest_events_retailer_time
  ON beacon_product_interest_events (retailer_id, occurred_at, event_id);

CREATE INDEX beacon_product_interest_events_category_time
  ON beacon_product_interest_events (catalog_category, occurred_at, event_id)
  WHERE catalog_category IS NOT NULL;

CREATE INDEX beacon_product_interest_events_placement_time
  ON beacon_product_interest_events (placement, occurred_at, event_id)
  WHERE placement IS NOT NULL;

CREATE INDEX beacon_product_interest_events_destination_time
  ON beacon_product_interest_events (destination_id, occurred_at, event_id)
  WHERE destination_id IS NOT NULL;
