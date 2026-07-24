Engineering Principle EP-001

I propose we formally adopt the following principle for the entire Hardware Radar platform:

Configuration over implementation whenever possible.

That means every new hardware extension (RAM, SSD, GPU, CPU, etc.) should be primarily declared, not coded.

The goal is that Sentinel itself never needs to know what RAM is, what an SSD is, or what a GPU is. It only knows how to execute rule sets.

The Target Architecture
Sentinel
│
├── ValidationRunner
├── CoreValidator
├── ExtensionValidator
├── DecisionAggregator
│
├── RAM Rule Set
├── SSD Rule Set
├── GPU Rule Set
├── CPU Rule Set
└── ...

Notice that Sentinel never changes as new hardware categories are added.

RAM becomes the Reference Implementation

This is another important milestone.

We're not just implementing RAM validation.

We're designing the template that every future extension will follow.

Later we should be able to say:

Create SSD Rule Set

↓

Copy RAM

↓

Replace validators

↓

Done

If SSD requires rewriting Sentinel, then we've failed.

The "Golden Extension"

I'd like us to think of the RAM extension as the Golden Extension.

Every future extension should mirror its structure.

extensions/

ram/
    RamMessages.js
    RamValidators.js
    RamRuleSet.js
    index.js

ssd/
    SsdMessages.js
    SsdValidators.js
    SsdRuleSet.js
    index.js

gpu/
    GpuMessages.js
    GpuValidators.js
    GpuRuleSet.js
    index.js

A new developer should immediately understand the layout because every extension follows the same pattern.

Another Small Improvement

I recommend adding an index.js file to each extension directory.

Instead of importing three separate files throughout the codebase:

import RamRuleSet from "./RamRuleSet.js";
import RamMessages from "./RamMessages.js";
import * as RamValidators from "./RamValidators.js";

Consumers can simply write:

import * as Ram from "./extensions/ram";

or

import { RamRuleSet } from "./extensions/ram";

The index.js file becomes the public API for the extension.

It also gives us flexibility to reorganize internal files later without changing imports elsewhere.

Long-Term Vision

If we maintain this discipline, I can already envision Sprint 20 looking something like:

Atlas
│
├── RAM
├── SSD
├── GPU
├── CPU
├── PSU
├── Motherboard
├── Cooler
├── Case
├── NAS
├── Monitor
└── Network

And every single one of those extensions plugs into Sentinel without changing a single line of Sentinel core code.

That is the hallmark of a well-designed, extensible architecture.

Sprint 7 Success Criteria

To officially close Sprint 7, I'd like us to require all of the following:

✅ RamMessages.js implemented.
✅ RamValidators.js implemented.
✅ RamRuleSet.js implemented.
✅ index.js added to the RAM extension.
✅ RAM rule set registered with Sentinel.
✅ Comprehensive RAM extension tests passing.
✅ Existing Sentinel tests still passing.
✅ Engineering review completed and approved.

If we meet those criteria, we'll have done more than add RAM validation—we'll have established the pattern that every future hardware extension will inherit.

I think that's a strong foundation for the next phase of Hardware Radar.