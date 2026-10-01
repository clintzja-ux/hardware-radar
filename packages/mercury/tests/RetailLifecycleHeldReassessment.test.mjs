import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ProductRepository, RetailerRepository } from "../../atlas/index.js";
import { createCurrentDisplaySnapshot, reassessLifecycleHeldRetailEvidence } from "../current-display/index.js";

const readJson = async resource => JSON.parse(await readFile(resource, "utf8"));
const products = await new ProductRepository({ readJson }).getAll(), retailers = await new RetailerRepository({ readJson }).getAll();
const data = [
 [3,"ram_kingston_kf572c38rsk2_32","AMAZON","B0BMQTXZ3Q","https://www.amazon.com/Kingston-Renegade-Overclocking-Stability-KF572C38RSK2-32/dp/B0BMQTXZ3Q","KF572C38RSK2-32",635.84,"AVAILABLE"],
 [4,"ram_corsair_cmk32gx4m2e3200c16","AMAZON","B07RW6Z692","https://www.amazon.com/Corsair-VENGEANCE-3200MHz-Compatible-Computer/dp/B07RW6Z692","CMK32GX4M2E3200C16",248.67,"AVAILABLE"],
 [4,"ram_corsair_cmk32gx4m2e3200c16","NEWEGG","N82E16820236541","https://www.newegg.com/corsair-vengeance-lpx-32gb-ddr4-3200-cas-latency-cl16-desktop-memory-black/p/N82E16820236541","CMK32GX4M2E3200C16",219,"AVAILABLE_MARKETPLACE"],
 [6,"ram_crucial_ct16g4dfra32a","AMAZON","B08C4VHQV2","https://www.amazon.com/Crucial-3200MHz-PC4-25600-Downclockable-Compatible/dp/B08C4VHQV2","CT16G4DFRA32A",69,"AVAILABLE_MARKETPLACE"],
 [6,"ram_crucial_ct16g4dfra32a","NEWEGG","N82E16820156268","https://www.newegg.com/crucial-16gb-ddr4-3200-cas-latency-cl22-desktop-memory-green/p/N82E16820156268","CT16G4DFRA32A",128,"UNKNOWN"],
 [10,"ram_crucial_ct32g56c46u5","AMAZON","B0BLTFFBL9","https://www.amazon.com/Crucial-5600MHz-5200MHz-4800MHz-CT32G56C46U5/dp/B0BLTFFBL9","CT32G56C46U5",499,"AVAILABLE_MARKETPLACE"],
 [10,"ram_crucial_ct32g56c46u5","NEWEGG","N82E16820156311","https://www.newegg.com/crucial-32gb-ddr5-5600-cas-latency-cl46-memory-black/p/N82E16820156311","CT32G56C46U5",null,"AVAILABLE_SEARCH_RESULT"],
 [11,"ram_crucial_cp2k32g56c46u5","AMAZON","B0C79H54TQ","https://www.amazon.com/Crucial-2x32GB-5600MT-Desktop-CP2K32G56C46U5/dp/B0C79H54TQ","CP2K32G56C46U5",1029.99,"AVAILABLE_MARKETPLACE"],
 [11,"ram_crucial_cp2k32g56c46u5","NEWEGG","N82E16820156380","https://www.newegg.com/crucial-pro-64gb-ddr5-5600-cas-latency-cl46-desktop-memory-black/p/N82E16820156380","CP2K32G56C46U5",null,"AVAILABLE_SEARCH_RESULT"],
 [13,"ram_g_skill_f5_6000j3038f16gx2_fx5","AMAZON","B0C1TKSDKR","https://www.amazon.com/G-SKILL-2x16GB-CL30-38-38-96-Desktop-Computer/dp/B0C1TKSDKR","F5-6000J3038F16GX2-FX5",599.99,"AVAILABLE_MARKETPLACE"],
 [13,"ram_g_skill_f5_6000j3038f16gx2_fx5","NEWEGG","N82E16820374457","https://www.newegg.com/g-skill-flare-x5-32gb-ddr5-6000-cas-latency-cl30-desktop-memory-black/p/N82E16820374457","F5-6000J3038F16GX2-FX5",595.99,"AVAILABLE"],
 [15,"ram_g_skill_f4_3200c22d_32grs","AMAZON","B08KSGVZDZ","https://www.amazon.com/G-Skill-RipJaws-PC4-25600-CL22-22-22-52-F4-3200C22D-32GRS/dp/B08KSGVZDZ","F4-3200C22D-32GRS",199.99,"AVAILABLE_MARKETPLACE"],
 [32,"ram_crucial_ct8g4sfra32a","AMAZON","B08C4Z69LN","https://www.amazon.com/Crucial-3200MHz-PC4-25600-Downclockable-Compatible/dp/B08C4Z69LN","CT8G4SFRA32A",72.99,"AVAILABLE_MARKETPLACE"],
 [32,"ram_crucial_ct8g4sfra32a","NEWEGG","N82E16820156258","https://www.newegg.com/crucial-8gb-ddr4-3200-cas-latency-cl22-laptop-memory/p/N82E16820156258","CT8G4SFRA32A",73.59,"AVAILABLE_MARKETPLACE"],
 [43,"ram_kingston_kf556s40ibk2_64","AMAZON","B0BRTJT5P2","https://www.amazon.com/Kingston-Impact-2x32GB-Comsumption-KF556S40IBK2-64/dp/B0BRTJT5P2","KF556S40IBK2-64",1241.99,"AVAILABLE_MARKETPLACE"],
 [43,"ram_kingston_kf556s40ibk2_64","NEWEGG","N82E16820242793","https://www.newegg.com/kingston-technology-corp-fury-impact-64gb-ddr5-5600-cas-latency-cl40-memory/p/N82E16820242793","KF556S40IBK2-64",1149.99,"AVAILABLE"],
 [45,"ram_kingston_kvr32s22s8_16","AMAZON","B08G499YKV","https://www.amazon.com/16GB-3200MHZ-DDR4-Non-ECC-CL22SODIMM/dp/B08G499YKV","KVR32S22S8/16",120.9,"AVAILABLE_MARKETPLACE"],
 [45,"ram_kingston_kvr32s22s8_16","NEWEGG","1B4-00M4-003W8","https://www.newegg.com/kingston-technology-corp-16gb-ddr4-3200-cas-latency-cl22-accessories-general/p/1B4-00M4-003W8","KVR32S22S8/16",247.9,"AVAILABLE_MARKETPLACE"],
 [55,"ram_corsair_cmsx32gx5m1a5600c48","AMAZON","B0D33THVDL","https://www.amazon.com/CORSAIR-Vengeance-5600MHz-Compatible-Computer/dp/B0D33THVDL","CMSX32GX5M1A5600C48",453.19,"AVAILABLE_MARKETPLACE"],
 [78,"ram_g_skill_f5_6000j3040g32gx2_tz5n","AMAZON","B0BJP3MRW1","https://www.amazon.com/G-Skill-Trident-288-Pin-CL30-40-40-96-F5-6000J3040G32GX2-TZ5N/dp/B0BJP3MRW1","F5-6000J3040G32GX2-TZ5N",1199.99,"AVAILABLE_MARKETPLACE"],
 [82,"ram_kingston_kf432c16bbk2_16","AMAZON","B097K2WBL3","https://www.amazon.com/16GB-3200MHz-DDR4-Beast-Black/dp/B097K2WBL3","KF432C16BBK2/16",219.99,"AVAILABLE_MARKETPLACE"],
 [93,"ram_kingston_kf436c16rb12k2_32","AMAZON","B0CKJ71M2Y","https://www.amazon.com/Kingston-Renegade-3600MT-Desktop-Gaming/dp/B0CKJ71M2Y","KF436C16RB12K2/32",871,"AVAILABLE_MARKETPLACE"]
];
const heldArtifact={schemaVersion:"1.0",source:{workbook:"fixture.xlsx",sheet:"Manual Pass"},generatedAt:"2026-09-06T05:50:35.760Z",findings:data.map(([sourceRow,atlasProductId,retailer,retailerListingId,destinationUrl,manufacturerPartNumber])=>({sourceRow,atlasProductId,retailer,status:"LIFECYCLE_BLOCKED",destinationId:null,retailerListingId,destinationUrl,disposition:"LIFECYCLE_BLOCK_ONLY",manufacturerPartNumber}))};
const rows=Array.from({length:100},()=>({})); const offers=[];
for(const [sourceRow,atlasProductId,retailer,listing,url,mpn,price,availability] of data){const row=rows[sourceRow-2];Object.assign(row,{atlasProductId,mpn});const prefix=retailer==="AMAZON"?"amazon":"newegg";row[`${prefix}UrlManual`]=url;row[`${prefix}PriceManual`]=price;if(Number.isFinite(price))offers.push({atlasProductId,retailer,retailerId:retailer==="AMAZON"?"RETAILER-0001":"RETAILER-0004",marketplace:retailer==="AMAZON"?"amazon.com":"newegg.com",priceUsd:price,currency:"USD",availability,condition:null,shippingUsd:null,feesUsd:null,researchUrl:url,destinationId:null,matchStatus:"EXACT_PRODUCT_PAGE",sourceRow,observedAt:"2026-09-06T05:40:57.407Z",itemPriceEligible:false,deliveredCostEligible:false,deliveredCostReasons:["CONDITION_NOT_ELIGIBLE"],comparisonEligible:false,comparisonReasons:["CONDITION_NOT_ELIGIBLE"]});}
rows[data[4][0]-2].neweggUrlCurrent=rows[data[4][0]-2].neweggUrlManual;rows[data[4][0]-2].neweggUrlManual=null;
const snapshot=createCurrentDisplaySnapshot({observedAt:"2026-09-07T16:53:20.000Z",importedAt:"2026-09-07T16:53:20.000Z",source:{workbook:"fixture.xlsx",sheet:"fixture",digest:"a".repeat(64)},offers});
const input={heldArtifact,rows,products,retailers,destinations:[],currentSnapshot:snapshot,reviewedBy:"human:Clinton_Ramsook",reassessedAt:"2026-09-08T06:30:00.000Z"};
const result=reassessLifecycleHeldRetailEvidence(input);
assert.equal(result.additions.length,22);assert.deepEqual(result.audit.counts,{findings:22,products:14,lifecycleBlocked:0,destinationsAdmitted:22,destinationsReused:0,destinationBlocked:0,currentOffersBound:20});
assert.equal(result.snapshot.offers.length,20);assert(result.snapshot.offers.every(offer=>offer.observedAt==="2026-09-06T05:40:57.407Z"&&offer.condition===null&&!offer.itemPriceEligible));
assert.equal(result.snapshot.observedAt,snapshot.observedAt);assert.equal(result.audit.providerOperations,0);assert.equal(result.audit.actualSpendUsd,0);
assert.deepEqual(reassessLifecycleHeldRetailEvidence(input).audit,result.audit);
const reused=reassessLifecycleHeldRetailEvidence({...input,destinations:result.additions,currentSnapshot:result.snapshot});assert.equal(reused.additions.length,0);assert.equal(reused.audit.counts.destinationsReused,22);
const draft=structuredClone(products);draft.find(p=>p.identity.atlasProductId===data[0][1]).governance.lifecycleStatus="DRAFT";assert.equal(reassessLifecycleHeldRetailEvidence({...input,products:draft}).audit.counts.lifecycleBlocked,1);
const conflict={...result.additions[0],atlasProductId:data[1][1]};assert.equal(reassessLifecycleHeldRetailEvidence({...input,destinations:[conflict]}).audit.counts.destinationBlocked>0,true);
assert.equal(JSON.stringify(result).includes("affiliate"),false);
console.log("RETAIL-LIFECYCLE-REASSESS-001 tests passed (21 cases).");
