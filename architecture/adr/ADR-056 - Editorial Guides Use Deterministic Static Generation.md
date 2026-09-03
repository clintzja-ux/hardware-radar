# ADR-056 — Editorial Guides Use Deterministic Static Generation

**Status:** Accepted
**Date:** 2026-09-02

## Context

Hardware Radar needs durable buying guidance without displacing its price-first product, inventing a second market-data authority, or adopting operational infrastructure disproportionate to the initial editorial scope. CONTENT-001 selected repository-authored Markdown and static delivery, but deferred the runtime decision until its concrete input and build contracts were known.

## Decision

Editorial Guides use this boundary:

```text
Markdown under content/guides/
+ validated front matter
→ deterministic repository-owned generator
→ reusable article template
→ plain static HTML under public/
```

The generator fails closed on unsupported metadata, unsafe Markdown, invalid internal routes, duplicate identity or canonical path, and malformed dates. Authored source and generated public output have separate ownership. Article bodies remain readable without client JavaScript. Editorial routes merge deterministically with the repository-owned static route manifest to produce `public/sitemap.xml`; source dates, never build time, own editorial `lastmod`.

CONTENT-002 fixtures are non-production inputs and render only into temporary test destinations. Adding generator capability does not publish a Guide or add Guides navigation.

## Rejected for this phase

- a CMS;
- migration to a site framework;
- client-rendered article bodies;
- a dynamic article API;
- a Forge editorial workflow;
- autonomous Aurora writing; and
- Atlas-generated prose.

These options add authority or operating complexity that the current static editorial surface does not require.

## Consequences

- normal public builds remain local, deterministic, and network-independent;
- malformed editorial source stops the build rather than producing broken pages;
- existing public and price pages remain independent of the editorial generator;
- Atlas, Mercury, recommendation, review, and publication authorities remain unchanged; and
- a later increment may publish Guides only by adding validated production Markdown and the separately approved navigation/hub changes.
