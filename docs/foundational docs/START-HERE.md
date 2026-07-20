# Hardware Radar

# START_HERE.md

Repository Reading Order

1. START_HERE.md

2. PRODUCT_CONSTITUTION.md

3. PROJECT_STATE.md

4. ENGINEERING_HANDBOOK.md

5. Relevant subsystem documentation

Only after reading these documents should implementation begin.

Welcome to the Hardware Radar repository.

This document is the starting point for all development work.

It explains the purpose of the repository, where to find important information, and the recommended workflow for contributing to the project.

---

# About Hardware Radar

Hardware Radar is a trust-first hardware intelligence platform.

Our mission is simple:

> Help people make confident hardware buying decisions quickly, honestly, and transparently.

The public website is already live at:

https://cheapestram.com

The website currently serves the RAM category using placeholder product and pricing data while the underlying platform continues to evolve.

---

# Repository Philosophy

The repository is the source of truth.

Every document has one responsibility.

Every topic has one canonical document.

Documentation exists to support engineering—not replace it.

Prefer incremental improvements over large rewrites.

---

# Read These Documents

Read these documents in this order before beginning development.

## 1. PRODUCT_CONSTITUTION.md

Defines:

- Mission
- Vision
- Core Promise
- Product Principles
- Trust Philosophy

This document rarely changes.

---

## 2. PROJECT_STATE.md

Defines the current state of the project.

Includes:

- Live platform status
- Technology stack
- Operational systems
- Planned systems
- Current priorities
- Technical debt

Read this before starting any engineering work.

---

## 3. Architecture Documentation

Location:

docs/architecture/

Contains subsystem documentation including:

- Atlas
- Mercury
- Forge
- Affiliate Layer
- ADRs

Read only the subsystem relevant to the work you are performing.

---

## 4. Engineering Handbook

Location:

docs/engineering/

Contains engineering standards, conventions, and development practices.

---

# Repository Structure

```
docs/

    START_HERE.md

    PRODUCT_CONSTITUTION.md

    PROJECT_STATE.md

    architecture/

    engineering/

    design/

    content/

    brand/

    roadmap/

    releases/

    sessions/
```

---

# Development Workflow

Every engineering session should follow this workflow:

1. Read START_HERE.md

2. Read PROJECT_STATE.md

3. Review the relevant subsystem documentation

4. Implement one focused improvement

5. Update documentation only if implementation requires it

6. Validate changes

7. Commit changes

---

# Current Engineering Focus

Hardware Radar is currently transitioning from a manually maintained website into an automated hardware intelligence platform.

The website is already live.

Current engineering efforts focus on improving:

- Atlas
- Mercury
- Forge

to support future automation and Amazon Associates integration.

---

# Guiding Principle

Every improvement should make Hardware Radar:

- More trustworthy
- More maintainable
- More automated
- Easier to understand

If a change does not improve at least one of these goals, reconsider it.