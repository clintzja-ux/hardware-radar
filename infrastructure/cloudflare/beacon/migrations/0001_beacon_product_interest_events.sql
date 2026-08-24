CREATE TABLE beacon_product_interest_events (
  event_id TEXT PRIMARY KEY NOT NULL,
  signal_id TEXT NOT NULL UNIQUE,
  material_fingerprint TEXT NOT NULL CHECK (length(material_fingerprint) = 64),
  atlas_product_id TEXT NOT NULL,
  retailer_id TEXT NOT NULL CHECK (retailer_id GLOB 'RETAILER-[0-9][0-9][0-9][0-9]'),
  signal_type TEXT NOT NULL CHECK (signal_type = 'OUTBOUND_RETAILER_CLICK'),
  source TEXT NOT NULL CHECK (source = 'HARDWARE_RADAR_FIRST_PARTY'),
  source_surface TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  value REAL NOT NULL CHECK (value >= 0),
  unit TEXT NOT NULL,
  evidence_kind TEXT NOT NULL CHECK (evidence_kind = 'RAW')
) STRICT;

CREATE INDEX beacon_product_interest_events_product_time
  ON beacon_product_interest_events (atlas_product_id, occurred_at, event_id);

CREATE INDEX beacon_product_interest_events_recorded_time
  ON beacon_product_interest_events (recorded_at, event_id);
