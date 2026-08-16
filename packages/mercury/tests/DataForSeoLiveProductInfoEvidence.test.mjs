import assert from "node:assert/strict";
import { createDataForSeoProductEvidence } from "../index.js";

const evidence = createDataForSeoProductEvidence({
  type: "product_info_element",
  title: "Corsair CMK32GX5M2B6000Z30 VENGEANCE DDR5 32GB2x16GB Memory Kit 6000MT/s 30-36-36-76 Std PMIC AMD EXPO 1.4V Black",
  data_docid: "17540895125310173539",
  specifications: [
    { specification_name: "Memory Voltage", specification_value: "1.40 V" },
    { specification_name: "Memory Technology", specification_value: "DDR5 SDRAM" },
    { specification_name: "CAS Latency", specification_value: "CL30" },
    { specification_name: "Memory Size", specification_value: "32 GB" },
    { specification_name: "Memory Speed", specification_value: "6000 MHz" },
    { specification_name: "Number of Modules", specification_value: "2 x 16GB" },
    { specification_name: "Form Factor", specification_value: "DIMM" },
    { specification_name: "Number of Pins", specification_value: "288-pin" }
  ]
});

assert.equal(evidence.memoryType, "DDR5 SDRAM");
assert.equal(evidence.capacityGb, 32);
assert.equal(evidence.moduleCount, 2);
assert.equal(evidence.dataRateMtps, 6000);
assert.equal(evidence.casLatency, 30);
assert.equal(evidence.formFactor, "DIMM");
assert.equal(evidence.rawSpecificationCount, 8);

console.log("DataForSEO live Product Info evidence regression tests passed.");
