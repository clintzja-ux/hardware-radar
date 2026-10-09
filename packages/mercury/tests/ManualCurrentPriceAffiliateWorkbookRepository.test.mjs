import assert from "node:assert/strict";
import crypto from "node:crypto";
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ManualCurrentPriceAffiliateWorkbookRepository, readManualCurrentPriceWorkbookRow } from "../current-display/index.js";
const source=path.resolve(".forge-review/retail-display/hardware-radar-amazon-newegg-manual-price-research-with-rakuten.xlsx"),id="ram_corsair_cmh16gx5m2b5200z40",sha=buffer=>crypto.createHash("sha256").update(buffer).digest("hex"),before=sha(await readFile(source)),root=await mkdtemp(path.join(os.tmpdir(),"affiliate-workbook-")),fixture=path.join(root,"fixture.xlsx");
try{
 await copyFile(source,fixture);
 const productRepository={getById:async value=>value===id?{identity:{atlasProductId:id}}:null},destinationRepository={getAll:async()=>[{atlasProductId:id,retailerId:"RETAILER-0004",status:"ACTIVE"}]},repository=new ManualCurrentPriceAffiliateWorkbookRepository({workbookPath:fixture,productRepository,destinationRepository,now:()=>"2026-10-08T18:00:00.000Z"}),state=await repository.inspect(id);
 await assert.rejects(()=>repository.apply({action:"REPLACE_AFFILIATE",atlasProductId:id,url:"https://click.linksynergy.com/deeplink?id=fixture",reason:"Fixture replacement",reviewedBy:"operator:test",reviewedAt:"2026-10-08T18:00:00.000Z",expectedWorkbookDigest:"stale"}),/STALE/);
 const replaced=await repository.apply({action:"REPLACE_AFFILIATE",atlasProductId:id,url:"https://click.linksynergy.com/deeplink?id=fixture",reason:"Fixture replacement",reviewedBy:"operator:test",reviewedAt:"2026-10-08T18:00:00.000Z",expectedWorkbookDigest:state.workbookDigest});
 assert.equal(replaced.status,"AFFILIATE_LINK_RETAINED");let row=await readManualCurrentPriceWorkbookRow({workbookPath:fixture,atlasProductId:id});assert.equal(row.rakutenRouting.affiliateUrl,"https://click.linksynergy.com/deeplink?id=fixture");assert.equal(row.rakutenRouting.notes,"Fixture replacement");assert.equal(row.neweggReference.destinationId,"mer_dest_d7dc195816062d094efacef9");
 const disabled=await repository.apply({action:"DISABLE_AFFILIATE",atlasProductId:id,reason:"Fixture disable",reviewedBy:"operator:test",reviewedAt:"2026-10-08T18:05:00.000Z",expectedWorkbookDigest:replaced.workbookDigest});
 assert.equal(disabled.status,"AFFILIATE_LINK_DISABLED");row=await readManualCurrentPriceWorkbookRow({workbookPath:fixture,atlasProductId:id});assert.equal(row.rakutenRouting.affiliateUrl,"");assert.equal(row.rakutenRouting.status,"MISSING");assert.equal(sha(await readFile(source)),before);console.log("Manual affiliate workbook writer: 11 assertions passed");
}finally{await rm(root,{recursive:true,force:true});}
