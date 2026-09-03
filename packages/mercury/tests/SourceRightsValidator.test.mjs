import assert from "node:assert/strict";
import registry from "../rights/SourceRightsRegistry.js";
import { validateSourceRightsProfile } from "../rights/SourceRightsValidator.js";
for (const profile of registry.getAll()) assert.equal(validateSourceRightsProfile(profile).valid,true, profile.sourceId);
assert.equal(validateSourceRightsProfile({sourceId:"bad"}).valid,false);
console.log("Source rights validator tests passed.");
