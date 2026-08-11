import assert from "node:assert/strict";
import { classifyObservationStorage, STORAGE_CLASSES } from "../retention/RetentionPolicy.js";
const o=(licenseContext)=>({observationTime:"2026-08-10T00:00:00Z",compliance:{licenseContext}});
assert.equal(classifyObservationStorage(o("AMAZON_CREATORS_API")).payloadExpiresAt,"2026-08-10T01:00:00.000Z");
assert.equal(classifyObservationStorage(o("BEST_BUY_PRODUCTS_API")).payloadExpiresAt,"2026-08-13T00:00:00.000Z");
assert.equal(classifyObservationStorage(o("INDEPENDENT_SOURCE")).storageClass,STORAGE_CLASSES.DURABLE);
assert.equal(classifyObservationStorage(o("UNKNOWN_VENDOR")).storageClass,STORAGE_CLASSES.RIGHTS_UNKNOWN);
console.log("Source rights retention tests passed.");
