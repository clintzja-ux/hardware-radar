Mirabelle Labs Engineering Handbook
Version 1.0

Purpose

This handbook defines the engineering philosophy, architectural principles, and development standards used across all Mirabelle Labs projects. It exists to ensure that every system—from games to websites to internal tooling—is built consistently, remains maintainable over time, and can evolve without unnecessary complexity.

1. Core Philosophy
Principle 1 — Design for the future. Build for today.

Every system should be designed with future expansion in mind, but only today's requirements should be implemented.

Good

Atlas supports GPUs someday.

Today only RAM exists.

Bad

Implement GPU support before
the first RAM product exists.
Principle 2 — Complexity must justify itself.

Every additional abstraction must solve a real problem.

If a simpler solution works today and can evolve cleanly later, choose the simpler solution.

Principle 3 — Boring engineering wins.

Prefer:

obvious code
readable code
predictable code

over clever solutions.

If future-you needs ten minutes to understand a function, it's too complicated.

2. Data Philosophy
Atlas

Atlas defines identity.

A product should exist exactly once.

Atlas answers:

What is this product?

Atlas never stores price history.

Mercury

Mercury records observations.

Mercury answers:

What did this retailer offer at this moment?

Observations are immutable.

Never edit history.

Create new observations.

Forge

Forge creates data.

Forge never becomes the source of truth.

It generates records.

Atlas and Mercury remain authoritative.

3. Single Responsibility

Every subsystem has one responsibility.

Example:

Atlas

↓

Product identity
Mercury

↓

Market observations
Forge

↓

Record generation
Hardware Radar

↓

Presentation

No subsystem should take responsibility for another.

4. Folder Philosophy

Folders represent responsibilities.

Never organize by file type.

Instead:

atlas/

means

Everything related to Atlas.

Not

json/

or

models/
5. Source of Truth

Every piece of information has one owner.

Examples

Product name

↓

Atlas

Price

↓

Mercury

Retailer

↓

Retailer registry

Brand

↓

Brand registry

Never duplicate data unless it is cached intentionally.

6. IDs

IDs are permanent.

Names can change.

URLs can change.

Descriptions can change.

IDs never change.

7. JSON First

Internal data should exist as JSON before databases are introduced.

Advantages:

Git history
human readable
easy backups
portable
easy validation

A database is introduced only when JSON becomes the bottleneck.

8. Internal Tools First

If engineers perform the same task repeatedly:

Don't automate immediately.

Observe first.

When the workflow stabilizes:

Build a tool.

Example:

Manual entry

↓

Atlas

↓

Mercury

↓

Forge
9. Version Everything

Schemas

Repositories

Templates

Internal tools

Documentation

All receive versions.

Nothing is "finished."

Everything evolves.

10. Documentation

Documentation is treated like code.

Every major architectural decision should answer:

Why?
Alternatives considered
Tradeoffs
Future implications
11. Code Reviews (Even Solo)

Before committing ask:

Can this be simpler?

Will I understand this in six months?

Does this duplicate an existing responsibility?

Am I solving today's problem or tomorrow's fantasy?

12. Release Philosophy

Small releases.

Frequent commits.

Each commit should leave the project in a working state.

Never accumulate dozens of unrelated changes.

13. Platform Vision

Mirabelle Labs builds platforms.

Applications consume platforms.

Example:

Forge
      │
      ▼
Atlas
      │
      ▼
Mercury
      │
      ▼
Hardware Radar

Tomorrow:

Lunchbox Lines

Torch

Future projects

↓

Reuse the same engineering philosophy.
14. Engineering Motto

I think we should end with something that reflects how we've actually worked together over the past several weeks.

Build systems that make tomorrow easier than today.

It captures why Atlas exists, why Mercury exists, why Forge exists, and even why you wanted Hardware Radar in the first place.