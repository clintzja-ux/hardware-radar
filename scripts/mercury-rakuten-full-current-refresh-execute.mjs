import {readFile,writeFile} from "node:fs/promises";
import path from "node:path";
import {FileCurrentDisplaySnapshotRepository} from "../packages/mercury/current-display/index.js";
import {createProductionRakutenCurrentQaService,executeRakutenFullCurrentRefresh} from "../packages/mercury/current-refresh/index.js";

const args=new Map(process.argv.slice(2).map(value=>{const at=value.indexOf("=");return at<0?[value,true]:[value.slice(0,at),value.slice(at+1)];}));
const required=name=>{const value=args.get(name);if(!value)throw new Error(`RAKUTEN_FULL_CURRENT_REFRESH_REQUIRED:${name}`);return String(value);};
const planId=required("--plan-id"),preparationId=required("--preparation-id"),executedBy=required("--executed-by"),confirmation=required("--confirm");
const root=process.cwd(),operationRoot=path.resolve(".forge-review/mercury/rakuten-full-current-refresh"),statePath=path.resolve(".forge-review/retail-display/current-display-snapshots.json"),readJson=async file=>JSON.parse(await readFile(file,"utf8"));
const plan=await readJson(path.join(operationRoot,`${planId}.json`)),preparation=await readJson(path.join(operationRoot,`${preparationId}.json`));
const repository=new FileCurrentDisplaySnapshotRepository({statePath});
const result=await executeRakutenFullCurrentRefresh({plan,preparation,currentSnapshotRepository:repository,authorizedPlanId:planId,authorizedPreparationId:preparationId,confirmation});
const after=await repository.getState();
const qa=await(await createProductionRakutenCurrentQaService({root})).generate({plan,preparation,currentExecution:result});
const receipt={schemaVersion:"1.0",executionType:"RAKUTEN_FULL_CURRENT_REFRESH_EXECUTION",executedBy,planId,preparationId,status:"EXECUTED_CONFIRMED",invocationStatus:result.status,resultSnapshotId:result.snapshotId,resultFingerprint:after.current.materialFingerprint,qaArtifact:{path:qa.path,sha256:qa.sha256,rows:qa.rows},historyMutation:false,destinationMutation:false,affiliateMutation:false,workbookMutation:false,publicationAuthority:false,releaseAuthority:false,providerCalls:0,paidTasks:0,actualSpendUsd:0};
await writeFile(path.join(operationRoot,`${planId}.execution.json`),`${JSON.stringify(receipt,null,2)}\n`,"utf8");
console.log(JSON.stringify({operation:"RAKUTEN_NEWEGG_FRESH_FULL_CURRENT_REFRESH_EXECUTE_P1",...result,qa:receipt.qaArtifact,releaseAuthority:false,deploymentAuthority:false},null,2));
