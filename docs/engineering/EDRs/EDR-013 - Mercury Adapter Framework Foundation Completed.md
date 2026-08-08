# EDR-013 — Mercury Adapter Framework Foundation Completed

**Status:** Accepted  
**Subsystem:** Mercury  
**Implementation Contract:** IC-MERCURY-002

## Decision

Mercury uses a registered adapter architecture for external retailer-specific input. Retailer-specific behavior is isolated behind the canonical RetailerAdapter contract.

Adapters translate and normalize external representations. They do not determine trust, freshness, confidence, certification, or publication eligibility.

## Outcome

The Adapter Registry, adapter validation, Amazon Adapter v1, Amazon normalization, adapter isolation controls, and dedicated adapter regression coverage were implemented and verified.
