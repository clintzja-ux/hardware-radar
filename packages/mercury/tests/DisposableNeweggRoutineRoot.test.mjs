import assert from "node:assert/strict";
import crypto from "node:crypto";
import {mkdtemp,readFile,rm,writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {DisposableNeweggRoutineRoot,FileDisposableNeweggValueRepository} from "../index.js";

const root=await mkdtemp(path.join(os.tmpdir(),"newegg-disposable-root-"));
try{
 const disposable=new DisposableNeweggRoutineRoot({root,sourceRoot:path.resolve(".")}),manifest=await disposable.initialize();
 assert.equal(manifest.productionWritersReachable,false);
 assert.equal(JSON.parse(await readFile(disposable.paths.currentPath,"utf8")).version,"1.0");
 assert.ok(JSON.parse(await readFile(path.join(disposable.paths.atlasRoot,"atlas-manifest.json"),"utf8")).products.length>=159);
 assert.throws(()=>disposable.assertWritablePath(path.resolve(".forge-review/retail-display/current-display-snapshots.json")),/PRODUCTION_WRITER_REJECTED/);
 const retained=path.join(os.tmpdir(),`retained-${crypto.randomUUID()}.gz`),bytes=Buffer.from("immutable retained evidence"),digest=crypto.createHash("sha256").update(bytes).digest("hex");await writeFile(retained,bytes);
 const evidence=await disposable.verifyRetainedArtifact({artifactPath:retained,expectedDigest:digest});assert.equal(evidence.readOnlyEvidence,true);await assert.rejects(()=>disposable.verifyRetainedArtifact({artifactPath:retained,expectedDigest:"0".repeat(64)}),/DIGEST_MISMATCH/);
 const store=new FileDisposableNeweggValueRepository({root,fileName:".forge-review/forge/value.json"});await store.put("value",{safe:true});assert.deepEqual(await store.get(),{safe:true});
 await rm(retained,{force:true});console.log("Disposable Newegg routine root tests passed: 12 cases.");
}finally{await rm(root,{recursive:true,force:true});}
