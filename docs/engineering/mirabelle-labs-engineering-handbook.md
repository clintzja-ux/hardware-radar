# Mirabelle Labs Engineering Handbook

**Document ID:** ML-ENGINEERING-HANDBOOK  
**Version:** 1.0  
**Status:** Canonical  
**Owner:** Mirabelle Labs  
**Primary Project:** Hardware Radar  
**Last Updated:** 2026-07-18

---

# 1. Purpose

This handbook defines the day-to-day engineering standards for Mirabelle Labs.

It governs how software is designed, written, reviewed, tested, documented, deployed, monitored, and maintained.

The Architecture Bible defines the long-term structure of the platform.

The Product Vision defines why the platform exists.

This handbook defines how engineers work within that structure.

---

# 2. Engineering Values

## 2.1 Truth Before Speed

Shipping quickly is valuable only when the result is correct, traceable, and maintainable.

Never trade away data integrity, compliance, or security for short-term delivery speed.

## 2.2 Simplicity Before Cleverness

Prefer explicit and understandable solutions.

Avoid unnecessary abstractions, premature microservices, and speculative complexity.

## 2.3 Stable Boundaries

Each subsystem owns one class of responsibility:

| Subsystem | Owns |
|---|---|
| Atlas | Canonical product truth |
| Mercury | Retailer and market observations |
| Sentinel | Validation and compliance decisions |
| Forge | Workflow orchestration |
| Hardware Radar | Public presentation |

No subsystem may silently assume ownership of another subsystem's data.

## 2.4 Evidence Before Assumption

Unknown values remain unknown.

Do not infer technical specifications, prices, availability, compatibility, or policy requirements without evidence.

## 2.5 Compliance by Design

Compliance rules must be represented in architecture, data models, validators, tests, and workflow gates.

Compliance is not a launch-day checklist.

## 2.6 Automation Must Be Earned

A manual process may be automated only after:

1. the process is understood;
2. the inputs and outputs are defined;
3. failure modes are known;
4. monitoring exists;
5. rollback or safe suppression is possible.

## 2.7 Every Important Action Is Traceable

Important data changes, validation decisions, approvals, and publications must preserve:

- actor;
- timestamp;
- previous state;
- new state;
- reason;
- source evidence;
- related revision or observation identifiers.

---

# 3. Scope

This handbook applies to:

- application code;
- infrastructure code;
- database schemas;
- data ingestion;
- validation rules;
- editorial tooling;
- public website code;
- APIs;
- scripts;
- tests;
- documentation;
- deployment pipelines.

It applies to employees, contractors, collaborators, and automated agents.

---

# 4. Repository Strategy

Hardware Radar should use a monorepo.

```text
hardware-radar/

├── apps/
│   ├── web/
│   ├── api/
│   └── worker/
│
├── packages/
│   ├── atlas/
│   ├── mercury/
│   ├── sentinel/
│   ├── forge/
│   ├── database/
│   ├── config/
│   ├── ui/
│   └── shared/
│
├── docs/
│   ├── architecture/
│   ├── compliance/
│   ├── data/
│   ├── decisions/
│   ├── implementation/
│   ├── operations/
│   ├── product/
│   └── runbooks/
│
├── infra/
│   ├── docker/
│   ├── deployment/
│   └── monitoring/
│
├── scripts/
├── tests/
└── .github/
    └── workflows/
```

## 4.1 Application Boundaries

### `apps/web`

Public Hardware Radar interface and internal Forge user interface when appropriate.

### `apps/api`

HTTP API and application services.

### `apps/worker`

Background jobs, refresh jobs, scheduled validation, monitoring tasks, and asynchronous processing.

## 4.2 Package Boundaries

Packages must expose intentional public interfaces.

Deep imports across package internals are prohibited.

Allowed:

```ts
import { validateAtlasRamRecord } from "@hardware-radar/sentinel";
```

Prohibited:

```ts
import { validateAtlasRamRecord } from "../../packages/sentinel/src/rules/atlas/internal";
```

---

# 5. Technology Standards

Initial approved stack:

| Area | Standard |
|---|---|
| Language | TypeScript |
| Frontend | Next.js and React |
| Backend | NestJS or a comparably structured Node.js framework |
| Database | PostgreSQL |
| ORM | Prisma |
| Jobs | BullMQ and Redis, introduced only when needed |
| Package manager | pnpm |
| Monorepo | pnpm workspaces and Turborepo |
| Unit testing | Vitest |
| End-to-end testing | Playwright |
| API testing | Supertest or framework equivalent |
| Linting | ESLint |
| Formatting | Prettier |
| Validation | Zod where practical |
| Containers | Docker |
| Error monitoring | Sentry |
| Telemetry | OpenTelemetry |
| CI/CD | GitHub Actions |

Technology changes require an Architecture Decision Record.

---

# 6. Naming Conventions

## 6.1 Files

Use `kebab-case`.

```text
atlas-product.service.ts
mercury-observation.schema.ts
sentinel-rule-registry.ts
```

## 6.2 TypeScript

- Classes: `PascalCase`
- Types and interfaces: `PascalCase`
- Functions and variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Database fields: `camelCase` in Prisma, mapped explicitly when necessary
- Environment variables: `UPPER_SNAKE_CASE`

## 6.3 Identifiers

Use domain-prefixed stable identifiers.

Examples:

```text
prd_ram_01J...
obs_amz_01J...
val_01J...
pub_01J...
wf_01J...
```

Human-readable slugs are not primary keys.

## 6.4 Boolean Names

Boolean fields must read as clear propositions.

Good:

```ts
isPublished
hasRgb
requiresRefresh
```

Avoid:

```ts
published
rgb
refresh
```

---

# 7. TypeScript Standards

## 7.1 Strict Mode

TypeScript strict mode is mandatory.

The following should remain enabled:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitOverride": true
}
```

## 7.2 Avoid `any`

`any` is prohibited except at controlled external boundaries and must be narrowed immediately.

Prefer:

- `unknown`;
- schema validation;
- discriminated unions;
- explicit interfaces.

## 7.3 Domain Types

Use domain-specific types rather than primitive strings where errors would be costly.

```ts
type AtlasProductId = string & { readonly __brand: "AtlasProductId" };
type ObservationId = string & { readonly __brand: "ObservationId" };
```

## 7.4 Pure Functions

Validation and transformation logic should be implemented as pure functions where practical.

## 7.5 Side Effects

Database writes, network calls, file writes, and logging should be explicit and isolated behind services or adapters.

---

# 8. Code Structure

Prefer small modules with one clear responsibility.

A service should not simultaneously:

- retrieve retailer data;
- normalize product identity;
- write database records;
- validate compliance;
- publish pages.

Those belong to separate modules.

## 8.1 Recommended Layering

```text
Controller / Handler
        ↓
Application Service
        ↓
Domain Logic
        ↓
Repository / Adapter
        ↓
External System
```

## 8.2 Dependency Direction

Domain packages must not depend on application or presentation packages.

```text
web → api → application → domain
                         → adapters
```

---

# 9. API Standards

## 9.1 General

APIs must be:

- versioned;
- typed;
- authenticated where required;
- documented;
- validated at boundaries;
- idempotent where practical.

## 9.2 REST Conventions

Examples:

```text
GET    /api/v1/atlas/products
GET    /api/v1/atlas/products/:id
POST   /api/v1/atlas/products
PATCH  /api/v1/atlas/products/:id

GET    /api/v1/mercury/observations
POST   /api/v1/mercury/observations/refresh

POST   /api/v1/sentinel/validate

POST   /api/v1/forge/publications
POST   /api/v1/forge/publications/:id/transition
```

## 9.3 Response Envelope

Successful list response:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 0
  }
}
```

Error response:

```json
{
  "error": {
    "code": "ATLAS_PRODUCT_NOT_FOUND",
    "message": "The requested Atlas product does not exist.",
    "requestId": "req_..."
  }
}
```

## 9.4 Error Codes

Error codes must be stable and machine-readable.

Do not expose raw stack traces to users.

---

# 10. Database Standards

## 10.1 PostgreSQL as Source of Record

Production application state must reside in PostgreSQL unless a documented exception exists.

## 10.2 Migrations

All schema changes require migrations.

Rules:

- migrations are committed;
- production migrations are never edited after deployment;
- destructive migrations require a rollback and data migration plan;
- nullable introduction should precede mandatory enforcement when migrating live data.

## 10.3 Ownership

Database tables must respect subsystem ownership.

Atlas tables must not acquire Mercury responsibilities.

Mercury observations must remain immutable.

## 10.4 Timestamps

All persisted timestamps use UTC.

Use:

```text
createdAt
updatedAt
observedAt
expiresAt
publishedAt
archivedAt
```

## 10.5 Soft Deletion

Use lifecycle states rather than deletion for important business records.

Hard deletion is reserved for:

- test data;
- legally required deletion;
- uncommitted transient data;
- explicit administrative cleanup.

## 10.6 Transactions

Use database transactions for operations that must succeed or fail atomically.

---

# 11. Data Integrity Standards

## 11.1 Null Over Guessing

Do not populate unknown fields with plausible values.

## 11.2 Derived Values

Derived values must be reproducible.

Example:

```text
capacityGb = moduleCount × capacityPerModuleGb
```

Do not store derived data unless:

- performance requires it;
- the source calculation is stable;
- consistency validation exists.

## 11.3 Retailer Content

Retailer data is observed, not canonical.

Every observation must preserve:

- retailer;
- marketplace;
- source method;
- retrieval time;
- adapter version;
- source evidence;
- expiration metadata where applicable.

---

# 12. Sentinel Rule Standards

Every active rule must have:

- permanent rule ID;
- owner;
- source requirement;
- severity;
- deterministic condition;
- pass criteria;
- failure code;
- remediation;
- tests;
- introduction version.

Critical uncertainty fails closed.

Rule behavior must not change without a version change and test update.

---

# 13. Forge Workflow Standards

No publication state may be changed by directly editing the database.

State changes must occur through Forge transition services.

Every transition records:

- actor;
- previous state;
- new state;
- reason;
- validation run;
- related Atlas revision;
- related Mercury observations.

---

# 14. Git Workflow

## 14.1 Protected Main Branch

`main` is protected.

Direct commits to `main` are prohibited except for emergency administrative recovery.

## 14.2 Branch Naming

```text
feature/atlas-product-schema
fix/mobile-card-clipping
docs/amazon-compliance-update
chore/upgrade-typescript
hotfix/affiliate-link-suppression
```

## 14.3 Pull Requests

Every production change requires a pull request.

Pull requests should be:

- focused;
- reviewable;
- tested;
- documented;
- reversible.

## 14.4 Commit Messages

Use Conventional Commits.

```text
feat(atlas): add RAM capacity validation
fix(web): prevent mobile comparison-card clipping
docs(sentinel): clarify expired observation handling
test(mercury): add supersession-cycle coverage
```

## 14.5 Commit Quality

Each commit should represent one coherent change.

Avoid mixing formatting, refactoring, and functional behavior in one commit unless inseparable.

---

# 15. Pull Request Requirements

Every pull request must include:

## Summary

What changed?

## Reason

Why is the change necessary?

## Architecture Impact

Does it alter subsystem responsibilities, data ownership, or dependencies?

## Testing

What tests were added or run?

## Compliance Impact

Does it affect retailer content, disclosures, affiliate links, data retention, or credentials?

## Migration

Does it require a database migration, backfill, environment change, or deployment sequence?

## Rollback

How can it be safely reversed?

---

# 16. Code Review Standards

Reviewers should verify:

- correctness;
- architectural fit;
- data ownership;
- security;
- compliance;
- test coverage;
- failure handling;
- readability;
- documentation;
- operational impact.

Review comments should identify:

- the issue;
- why it matters;
- the expected correction.

A reviewer should not approve code they do not understand.

---

# 17. Testing Standards

## 17.1 Test Pyramid

Use:

- many unit tests;
- targeted integration tests;
- fewer end-to-end tests.

## 17.2 Required Coverage

Every critical business rule requires explicit tests.

Examples:

- Atlas invariants;
- Mercury immutability;
- Sentinel blocking rules;
- Forge transition permissions;
- disclosure rendering;
- affiliate destination correctness;
- observation expiration;
- kill-switch behavior.

## 17.3 Test Naming

```ts
it("blocks publication when the selected observation has expired", ...)
```

Test names should describe behavior, not implementation.

## 17.4 Test Fixtures

Fixtures must be:

- deterministic;
- minimal;
- clearly named;
- independent of production secrets;
- representative of real edge cases.

## 17.5 External APIs

External services must be mocked in unit tests.

Integration testing against live retailer APIs must be controlled, rate-limited, and excluded from ordinary pull-request execution.

---

# 18. Security Standards

## 18.1 Secrets

Secrets must never appear in:

- source code;
- Git history;
- frontend bundles;
- logs;
- screenshots;
- documentation;
- sample configuration.

Use environment variables and approved secret storage.

## 18.2 Least Privilege

Services and users receive only the access required for their role.

## 18.3 Authentication

Internal Forge functionality requires authentication.

Sensitive actions require authorization, not merely authentication.

## 18.4 Dependency Security

Dependencies must be:

- actively maintained;
- reviewed before adoption;
- scanned automatically;
- updated deliberately.

## 18.5 Secret Scanning

Secret scanning must run:

- locally where practical;
- in CI;
- against production build artifacts.

## 18.6 Security Incidents

Credential exposure triggers:

1. immediate revocation;
2. emergency suppression if relevant;
3. credential rotation;
4. impact review;
5. audit record;
6. corrective action.

---

# 19. Logging Standards

Logs must be structured.

Recommended fields:

```json
{
  "level": "info",
  "event": "mercury.observation.created",
  "requestId": "req_...",
  "observationId": "obs_...",
  "atlasProductId": "prd_...",
  "retailer": "AMAZON",
  "timestamp": "2026-07-18T15:00:00Z"
}
```

## 19.1 Never Log

- passwords;
- private keys;
- authorization headers;
- complete raw licensed payloads unless explicitly approved;
- personal information not required for operations.

## 19.2 Correlation

Requests, jobs, validations, and publication actions should use correlation identifiers.

---

# 20. Error Handling

Errors must be classified.

## Expected Domain Error

Example:

```text
OBSERVATION_EXPIRED
```

Return a controlled error and remediation guidance.

## Transient Infrastructure Error

Example:

```text
DATABASE_TIMEOUT
```

Retry only when the operation is safe and retry policy is explicit.

## Unknown Error

Capture, report, and fail safely.

Do not convert unknown failures into successful responses.

---

# 21. Observability

Production services should expose:

- health status;
- readiness status;
- request latency;
- error rates;
- job success and failure;
- API dependency status;
- observation freshness;
- validation failure counts;
- publication-block counts.

Alerts should be actionable.

Avoid alerts that routinely fire without requiring action.

---

# 22. Documentation Standards

Documentation changes are part of implementation, not optional follow-up work.

Update documentation when changing:

- architecture;
- data ownership;
- API contracts;
- schemas;
- workflow states;
- compliance behavior;
- operational procedures;
- deployment steps.

## 22.1 Architecture Decision Records

Use ADRs for meaningful technical decisions.

Suggested format:

```text
ADR-0001: Use PostgreSQL as the canonical database
Status: Accepted
Context:
Decision:
Consequences:
Alternatives Considered:
```

## 22.2 Code Comments

Comments should explain why, not restate what the code does.

---

# 23. Release Standards

Use semantic versioning where packages or public contracts are versioned.

## Release Requirements

Before release:

- CI passes;
- migrations reviewed;
- Sentinel-critical tests pass;
- security scan passes;
- release notes prepared;
- rollback plan exists;
- monitoring is ready.

## Deployment Strategy

Prefer small, reversible deployments.

Use feature flags for incomplete or high-risk functionality.

---

# 24. Environment Standards

At minimum:

```text
development
test
staging
production
```

Each environment should use separate:

- databases;
- credentials;
- affiliate identifiers where supported;
- logs;
- monitoring context.

Production data should not be copied into development without sanitization.

---

# 25. Dependency Policy

Before adding a dependency, confirm:

1. Is it necessary?
2. Is it maintained?
3. Is its license acceptable?
4. Is its security posture acceptable?
5. Does it duplicate existing functionality?
6. What is the exit strategy?

Avoid dependencies for trivial functionality.

---

# 26. Performance Standards

Optimize measured bottlenecks.

Initial performance priorities:

- fast category-page rendering;
- efficient product retrieval;
- bounded retailer refresh jobs;
- indexed observation queries;
- cached public responses where compliant;
- small frontend bundles.

Performance work must not weaken compliance or data freshness guarantees.

---

# 27. Accessibility Standards

Public and internal interfaces should meet WCAG 2.2 AA where practical.

Required areas include:

- keyboard navigation;
- visible focus;
- sufficient contrast;
- semantic headings;
- accessible forms;
- disclosure readability;
- screen-reader-compatible price and retailer information.

---

# 28. Privacy Standards

Collect the minimum user data required.

The MVP should avoid user accounts unless product needs justify them.

Analytics should be privacy-conscious and documented.

---

# 29. Operational Runbooks

Runbooks should exist for:

- Amazon credential compromise;
- retailer API outage;
- invalid price publication;
- missing disclosure;
- database recovery;
- failed deployment;
- observation-refresh backlog;
- global retailer suppression;
- Sentinel rule regression.

---

# 30. Definition of Done

A change is complete only when:

- implementation is correct;
- tests pass;
- documentation is current;
- logging and monitoring are adequate;
- security and compliance impacts are addressed;
- migration and rollback are understood;
- review is complete;
- acceptance criteria are met.

"Works on my machine" is not a definition of done.

---

# 31. Initial Implementation Policy

Hardware Radar will be implemented in this order:

```text
1. Repository and tooling
2. Database foundation
3. Atlas
4. Mercury
5. Sentinel
6. Forge
7. Public Hardware Radar integration
8. Monitoring and operational automation
```

Do not implement later-layer shortcuts that bypass unfinished lower layers.

---

# 32. Canonical Engineering Statement

```text
Build for clarity.

Preserve truth.

Respect system boundaries.

Validate before publishing.

Make important decisions traceable.

Automate only what is understood.

Protect user trust.
```