# Hardware Radar Platform Implementation Blueprint

**Document ID:** HR-IMPLEMENTATION-BLUEPRINT
**Version:** 0.1
**Status:** Canonical Draft
**Owner:** Mirabelle Labs

# 1. Objective

This blueprint converts the platform architecture into an implementation plan.

It bridges the gap between design documents and production code.

---

# 2. Target Architecture

```text
Internet
    │
Hardware Radar (Next.js)
    │
REST API
    │
Forge
    │
Sentinel
    │
Atlas + Mercury
    │
PostgreSQL
```

Supporting services:

- Background workers
- Scheduler
- Object storage
- Logging
- Monitoring

---

# 3. Recommended Technology Stack

## Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS

## Backend

- Node.js
- NestJS
- TypeScript

## Database

- PostgreSQL

## ORM

- Prisma

## Jobs

- BullMQ + Redis

## Hosting

- Cloudflare
- Railway/Fly.io (MVP)
- Docker

## Monitoring

- OpenTelemetry
- Grafana
- Sentry

---

# 4. Monorepo Structure

```text
hardware-radar/

apps/
    web/
    api/

packages/
    atlas/
    mercury/
    sentinel/
    forge/
    shared/

docs/

scripts/

infra/
```

---

# 5. Database Ownership

Atlas tables

- products
- product_sources
- product_revisions

Mercury tables

- observations
- retailer_sources
- observation_history

Forge tables

- publications
- approvals
- workflow_events

Sentinel tables

- validation_runs
- validation_results
- exceptions

---

# 6. API Boundaries

Atlas API

- GET product
- CREATE product
- UPDATE product
- SEARCH products

Mercury API

- Refresh observation
- Get observations
- Compare observations

Sentinel API

- Validate Atlas
- Validate Mercury
- Validate Publication

Forge API

- Publish
- Schedule
- Refresh
- Archive

---

# 7. Background Jobs

- Amazon refresh
- Observation expiry
- Revalidation
- Sitemap generation
- Search indexing
- Health checks

---

# 8. CI/CD Pipeline

Every pull request:

1. Build
2. Lint
3. Unit tests
4. Integration tests
5. Sentinel validation
6. Security scan
7. Documentation validation

Deployment only proceeds if all stages pass.

---

# 9. MVP Milestones

Phase 1
- Repository
- CI
- Database
- Authentication

Phase 2
- Atlas implementation
- RAM schema
- CRUD

Phase 3
- Mercury
- Amazon adapter
- Observation storage

Phase 4
- Sentinel
- Rule engine
- Validation API

Phase 5
- Forge
- Workflow
- Publishing

Phase 6
- Hardware Radar frontend

Phase 7
- Monitoring
- Automation
- Public launch

---

# 10. Security

- Secrets only in environment variables
- HTTPS everywhere
- Principle of least privilege
- Immutable audit logs
- Automated secret scanning

---

# 11. Launch Checklist

- Atlas schema stable
- Mercury immutable
- Sentinel gates enforced
- Forge workflow operational
- Amazon compliance verified
- Monitoring enabled
- Backups configured
- Disaster recovery tested

---

# 12. Definition of Done

The MVP is complete when:

- Users can browse products.
- Atlas stores canonical specifications.
- Mercury stores immutable observations.
- Sentinel blocks invalid publications.
- Forge publishes compliant pages.
- Hardware Radar renders live pages.
- Amazon integration operates within documented compliance requirements.

---

# Canonical Summary

Build in layers.

1. Atlas
2. Mercury
3. Sentinel
4. Forge
5. Hardware Radar

Never bypass lower layers.

Every published page should be traceable back to:
- Atlas revision
- Mercury observation
- Sentinel validation run
- Forge publication event