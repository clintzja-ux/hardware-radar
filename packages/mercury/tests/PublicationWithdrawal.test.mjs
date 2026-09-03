import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Mercury } from "../Mercury.js";
import { PublicationAtlasResolver } from "../publication/PublicationAtlasResolver.js";
import { readFile } from "node:fs/promises";
import { FileObservationAcceptanceRepository } from "../persistence/FileObservationAcceptanceRepository.js";
import { FileReviewDecisionRepository } from "../review/persistence/FileReviewDecisionRepository.js";
import { FilePublicationDecisionRepository } from "../publication/persistence/FilePublicationDecisionRepository.js";
import { PublicationWorkflowService } from "../publication/PublicationWorkflowService.js";
import { createReviewDecision } from "../review/ObservationReviewDecision.js";
import { makeAmazonApiObservation } from "./helpers/publicationFixture.mjs";
const atlasProduct = JSON.parse(await readFile(new URL("../../atlas/products/ram/ddr5/HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000-cl30.json", import.meta.url), "utf8"));
const atlasRetailer = JSON.parse(await readFile(new URL("../../atlas/retailers/RETAILER-0001-amazon.json", import.meta.url), "utf8"));
const atlas = new PublicationAtlasResolver({ products: [atlasProduct], retailers: [atlasRetailer] });
const dir=await mkdtemp(path.join(os.tmpdir(),"mercury-pub-withdraw-"));
try {
 const acceptance=new FileObservationAcceptanceRepository({statePath:path.join(dir,"obs.json"),environment:"development"}); const id=await acceptance.allocateObservationId(); await acceptance.accept(makeAmazonApiObservation(id),"k");
 const reviews=new FileReviewDecisionRepository({statePath:path.join(dir,"rev.json"),acceptanceRepository:acceptance,environment:"development"}); await reviews.recordDecision(createReviewDecision({observationId:id,decision:"REVIEWED",reviewedBy:"op",reviewedAt:"2026-08-10T15:10:00Z"}));
 const pubs=new FilePublicationDecisionRepository({statePath:path.join(dir,"pub.json"),acceptanceRepository:acceptance,reviewRepository:reviews,environment:"development"}); const workflow=new PublicationWorkflowService({acceptanceRepository:acceptance,reviewRepository:reviews,publicationRepository:pubs,mercury:new Mercury(),atlas});
 await workflow.authorizePublish({observationId:id,authorizedBy:"op",authorizedAt:"2026-08-10T15:20:00Z"}); assert.equal((await workflow.getGovernedPublishedObservations({asOf:"2026-08-10T15:25:00Z"})).length,1);
 await workflow.withdraw({observationId:id,authorizedBy:"op",authorizedAt:"2026-08-10T15:26:00Z",reasonCodes:["MANUAL_WITHDRAWAL"]}); assert.equal((await workflow.getGovernedPublishedObservations({asOf:"2026-08-10T15:27:00Z"})).length,0);
 console.log("Publication withdrawal tests passed.");
} finally {await rm(dir,{recursive:true,force:true});}
