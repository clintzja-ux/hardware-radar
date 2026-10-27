import assert from "node:assert/strict";
import crypto from "node:crypto";
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { inflateRawSync } from "node:zlib";
import { ManualCurrentPriceAffiliateWorkbookRepository, readManualCurrentPriceWorkbookRow, readManualCurrentPriceWorkbookRows } from "../current-display/index.js";

function workbookEntries(buffer) {
  const eocd=buffer.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));
  assert.notEqual(eocd,-1,"workbook must remain a valid ZIP package");
  const count=buffer.readUInt16LE(eocd+10), entries=new Map(); let cursor=buffer.readUInt32LE(eocd+16);
  for(let index=0;index<count;index++) {
    assert.equal(buffer.readUInt32LE(cursor),0x02014b50);
    const compression=buffer.readUInt16LE(cursor+10), compressedSize=buffer.readUInt32LE(cursor+20), nameLength=buffer.readUInt16LE(cursor+28), extraLength=buffer.readUInt16LE(cursor+30), commentLength=buffer.readUInt16LE(cursor+32), localOffset=buffer.readUInt32LE(cursor+42);
    const name=buffer.subarray(cursor+46,cursor+46+nameLength).toString("utf8"), localNameLength=buffer.readUInt16LE(localOffset+26), localExtraLength=buffer.readUInt16LE(localOffset+28), start=localOffset+30+localNameLength+localExtraLength, compressed=buffer.subarray(start,start+compressedSize);
    entries.set(name,{compressed:Buffer.from(compressed),data:compression===0?Buffer.from(compressed):inflateRawSync(compressed)});
    cursor+=46+nameLength+extraLength+commentLength;
  }
  return entries;
}

const source=path.resolve(".forge-review/retail-display/hardware-radar-amazon-newegg-manual-price-research-with-rakuten.xlsx");
const existingId="ram_corsair_cmh16gx5m2b5200z40", newId="ram_fixture_newly_activated_product";
const sha=buffer=>crypto.createHash("sha256").update(buffer).digest("hex"), before=sha(await readFile(source));
const product=(id,lifecycleStatus="ACTIVE",publicationStatus="READY")=>({identity:{atlasProductId:id,brand:"Fixture",displayName:"Fixture Newly Activated 32GB Kit",manufacturerPartNumber:"FIXTURE-32G",manufacturer:"Fixture"},governance:{lifecycleStatus,publicationStatus},extension:{data:{classification:{memoryType:"DDR5",formFactor:"DIMM"},capacity:{capacityGb:32,moduleCount:2,capacityPerModuleGb:16}}}});
const destination=(id,listing="N82E16800000001")=>({destinationId:`mer_dest_${id.slice(-12)}`,atlasProductId:id,retailerId:"RETAILER-0004",marketplace:"newegg.com",destinationUrl:`https://www.newegg.com/p/${listing}`,retailerListingId:listing,status:"ACTIVE"});
const affiliate=(listing,tag="fixture")=>`https://click.linksynergy.com/deeplink?id=${tag}&mid=44583&murl=${encodeURIComponent(`https://www.newegg.com/p/${listing}`)}`;
const root=await mkdtemp(path.join(os.tmpdir(),"affiliate-workbook-")), fixture=path.join(root,"fixture.xlsx");
try {
  await copyFile(source,fixture);
  const products=new Map([[existingId,product(existingId)],[newId,product(newId)]]), destinations=[destination(existingId,"N82E16820236886"),destination(newId)];
  const existingRow=await readManualCurrentPriceWorkbookRow({workbookPath:fixture,atlasProductId:existingId});
  destinations[0]={...destinations[0],destinationId:existingRow.neweggReference.destinationId,destinationUrl:existingRow.neweggReference.url,retailerListingId:existingRow.neweggReference.listingId};
  const productRepository={getById:async id=>products.get(id)??null}, destinationRepository={getAll:async()=>destinations}, repository=new ManualCurrentPriceAffiliateWorkbookRepository({workbookPath:fixture,productRepository,destinationRepository});
  const sourceEntries=workbookEntries(await readFile(fixture)), initialRows=(await readManualCurrentPriceWorkbookRows({workbookPath:fixture})).length, inspection=await repository.inspect(newId);
  assert.equal(inspection.admissionRequired,true); assert.equal(inspection.row.neweggReference.destinationId,destinations[1].destinationId);
  await assert.rejects(()=>repository.apply({action:"ADD_AFFILIATE",atlasProductId:newId,url:affiliate(destinations[1].retailerListingId),reason:"Admission",reviewedBy:"operator:test",reviewedAt:"2026-10-12T18:00:00.000Z",expectedWorkbookDigest:"stale"}),/STALE/);
  const admitted=await repository.apply({action:"ADD_AFFILIATE",atlasProductId:newId,url:affiliate(destinations[1].retailerListingId),reason:"Governed new-product admission",reviewedBy:"operator:test",reviewedAt:"2026-10-12T18:00:00.000Z",expectedWorkbookDigest:inspection.workbookDigest});
  assert.equal(admitted.productAdmitted,true); assert.equal((await readManualCurrentPriceWorkbookRows({workbookPath:fixture})).length,initialRows+1);
  const admittedEntries=workbookEntries(await readFile(fixture)), sheet=admittedEntries.get("xl/worksheets/sheet2.xml").data.toString(), table=admittedEntries.get("xl/tables/table1.xml").data.toString(), admittedRow=initialRows+5;
  assert.match(sheet,new RegExp(`<row[^>]*r="${admittedRow}"[\\s\\S]*?<c[^>]*r="A${admittedRow}"[^>]*s="\\d+"`));
  for(const column of ["U","AM","AZ"]) assert.match(sheet,new RegExp(`<c[^>]*r="${column}${admittedRow}"[^>]*s="\\d+"[\\s\\S]*?<f>`));
  assert.match(sheet,new RegExp(`<dimension[^>]*ref="A\\d+:[A-Z]+${admittedRow}"`));
  assert.match(sheet,new RegExp(`sqref="[^"]*${admittedRow}`));
  assert.match(table,new RegExp(`ref="A4:[A-Z]+${admittedRow}"`));
  assert.deepEqual([...admittedEntries.keys()],[...sourceEntries.keys()]);
  for(const [name,entry] of sourceEntries) if(!["xl/worksheets/sheet2.xml","xl/tables/table1.xml"].includes(name)) assert.deepEqual(admittedEntries.get(name).compressed,entry.compressed,`${name} must remain byte-identical`);
  let row=await readManualCurrentPriceWorkbookRow({workbookPath:fixture,atlasProductId:newId});
  assert.equal(row.rakutenRouting.affiliateUrl,affiliate(destinations[1].retailerListingId)); assert.equal(row.rakutenRouting.status,"READY"); assert.equal(row.recordReviewedBy,"operator:test");
  assert.equal(row.neweggObservation.itemPriceUsd,null); assert.equal(row.neweggObservation.readyForImport,"NO"); assert.equal(row.amazonObservation.readyForImport,"NO");
  const replacement=affiliate(destinations[1].retailerListingId,"replacement"), replaced=await repository.apply({action:"REPLACE_AFFILIATE",atlasProductId:newId,url:replacement,reason:"Replace route",reviewedBy:"operator:test",reviewedAt:"2026-10-12T18:05:00.000Z",expectedWorkbookDigest:admitted.workbookDigest});
  row=await readManualCurrentPriceWorkbookRow({workbookPath:fixture,atlasProductId:newId}); assert.equal(row.rakutenRouting.affiliateUrl,replacement); assert.equal(replaced.productAdmitted,false);
  products.set("ram_fixture_duplicate_route",product("ram_fixture_duplicate_route")); destinations.push(destination("ram_fixture_duplicate_route","N82E16800000005"));
  const duplicateState=await repository.inspect("ram_fixture_duplicate_route");
  await assert.rejects(()=>repository.apply({action:"ADD_AFFILIATE",atlasProductId:"ram_fixture_duplicate_route",url:replacement,reason:"Duplicate route",reviewedBy:"operator:test",reviewedAt:"2026-10-12T18:07:00.000Z",expectedWorkbookDigest:duplicateState.workbookDigest}),/AFFILIATE_PRODUCT_BINDING_AMBIGUOUS/);
  const disabled=await repository.apply({action:"DISABLE_AFFILIATE",atlasProductId:newId,reason:"Disable route",reviewedBy:"operator:test",reviewedAt:"2026-10-12T18:10:00.000Z",expectedWorkbookDigest:replaced.workbookDigest});
  row=await readManualCurrentPriceWorkbookRow({workbookPath:fixture,atlasProductId:newId}); assert.equal(row.rakutenRouting.affiliateUrl,""); assert.equal(row.rakutenRouting.status,"MISSING");
  assert.match(workbookEntries(await readFile(fixture)).get("xl/worksheets/sheet2.xml").data.toString(),new RegExp(`<c[^>]*r="AZ${admittedRow}"[^>]*s="\\d+"[\\s\\S]*?<f>`));
  assert.ok(await readFile(admitted.backupPath)); assert.ok(await readFile(replaced.backupPath)); assert.ok(await readFile(disabled.backupPath));
  products.set("ram_fixture_draft",product("ram_fixture_draft","DRAFT","PENDING")); destinations.push(destination("ram_fixture_draft","N82E16800000002"));
  await assert.rejects(()=>repository.inspect("ram_fixture_draft"),/AFFILIATE_PRODUCT_NOT_ELIGIBLE/);
  products.set("ram_fixture_ambiguous",product("ram_fixture_ambiguous")); destinations.push(destination("ram_fixture_ambiguous","N82E16800000003"),destination("ram_fixture_ambiguous","N82E16800000004"));
  await assert.rejects(()=>repository.inspect("ram_fixture_ambiguous"),/AFFILIATE_NEWEGG_DESTINATION_REQUIRED/);
  const state=await repository.inspect(existingId);
  await assert.rejects(()=>repository.apply({action:"REPLACE_AFFILIATE",atlasProductId:existingId,url:affiliate("N82E16899999999"),reason:"Wrong listing",reviewedBy:"operator:test",reviewedAt:"2026-10-12T18:15:00.000Z",expectedWorkbookDigest:state.workbookDigest}),/AFFILIATE_RETAILER_LISTING_INVALID/);
  assert.equal(sha(await readFile(source)),before);
  console.log("Manual affiliate workbook writer: new-product admission, replacement, disable, recovery, stale, lifecycle, destination, and identity safeguards passed.");
} finally { await rm(root,{recursive:true,force:true}); }
