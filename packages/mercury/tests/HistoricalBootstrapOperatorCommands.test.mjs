import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { runHistoricalBootstrapCommand } from "../../../scripts/mercury-history-bootstrap-command.mjs";
import { createProductionHistoricalBootstrapCommandService } from "../index.js";

const calls = [];
const service = Object.fromEntries([
  ["init", { checkpointId: "cp" }], ["inspect", { checkpointId: "cp", cohortState: "READY_FOR_PAID_TASK" }],
  ["authorizeNext", { authorizationId: "auth" }], ["prepareNext", { checkpointId: "cp" }],
  ["executeNext", { status: "PAID_TASK_CREATED", actualSpendUsd: 0.001 }], ["retrieve", { status: "PENDING", actualSpendUsd: 0 }],
  ["process", { checkpointId: "cp" }], ["cancel", { checkpointId: "cp" }]
].map(([name, result]) => [name, async input => (calls.push({ name, input }), result)]));
const output = [];
const run = (action, args) => runHistoricalBootstrapCommand(action, { args, service, write: value => output.push(value) });

await run("init", ["--artifact=a", "--initialized-by=operator:test", "--confirmation=INITIALIZE-HISTORICAL-BOOTSTRAP-a"]);
await run("inspect", ["--checkpoint=cp"]);
await run("authorize-next", ["--checkpoint=cp", "--authorized-by=operator:test", "--reason=fixture", "--confirmation=AUTHORIZE-PRODUCTS-cp", "--ttl-minutes=10"]);
await run("prepare-next", ["--checkpoint=cp", "--authorization=auth"]);
await run("execute-next", ["--checkpoint=cp", "--authorization=auth", "--executed-by=operator:test", "--confirmation=EXECUTE-PRODUCTS-cp"]);
await run("retrieve", ["--checkpoint=cp"]);
await run("process", ["--checkpoint=cp"]);
await run("cancel", ["--checkpoint=cp", "--cancelled-by=operator:test", "--reason=fixture", "--confirmation=CANCEL-HISTORICAL-BOOTSTRAP-cp"]);
assert.deepEqual(calls.map(value => value.name), ["init", "inspect", "authorizeNext", "prepareNext", "executeNext", "retrieve", "process", "cancel"]);
assert.equal(calls[2].input.ttlMinutes, 10);
assert.equal(output[4].paidTaskCreated, true);
assert.equal(output[5].actualSpendUsd, 0);

for (const [action, args] of [
  ["inspect", []], ["inspect", ["--checkpoint=cp", "--product=evil"]],
  ["prepare-next", ["--checkpoint=cp", "--authorization=auth", "--proposal=x"]],
  ["retrieve", ["--checkpoint=cp", "--provider-task=t"]],
  ["authorize-next", ["--checkpoint=cp", "--authorized-by=x", "--reason=x", "--confirmation=x", "--ttl-minutes=0"]]
]) await assert.rejects(() => run(action, args), /HISTORY_041_/);

const packageJson = JSON.parse(await readFile(new URL("../../../package.json", import.meta.url), "utf8"));
const expected = ["init", "inspect", "authorize-next", "prepare-next", "execute-next", "retrieve", "process", "cancel"];
for (const action of expected) assert.equal(typeof packageJson.scripts[`mercury:history:bootstrap:${action}`], "string");
assert.equal(Object.keys(packageJson.scripts).some(key => /^mercury:history:bootstrap:.*(?:run-all|resume-all|cohort)/.test(key)), false);

createProductionHistoricalBootstrapCommandService({
  stateRoot: "fixture/history", acquisitionRoot: "fixture/acquisition", mercuryRoot: "fixture/mercury", identityRoot: "fixture/identity"
});

const execute = promisify(execFile);
for (const action of expected) {
  const script = fileURLToPath(new URL(`../../../scripts/mercury-history-bootstrap-${action}.mjs`, import.meta.url));
  await assert.rejects(
    () => execute(process.execPath, [script, "--raw-prepare-artifact=evil"], { cwd: process.cwd() }),
    error => error.code === 1 && /HISTORY_041_ARGUMENT_NOT_ALLOWED/.test(error.stderr)
  );
}

const loader = pathToFileURL(fileURLToPath(new URL("./fixtures/HistoricalBootstrapCliLoader.mjs", import.meta.url))).href;
const wrappers = Object.fromEntries(expected.map(action => [action, fileURLToPath(new URL(`../../../scripts/mercury-history-bootstrap-${action}.mjs`, import.meta.url))]));
async function shell(cwd, action, args, env) {
  const value = await execute(process.execPath, ["--experimental-loader", loader, wrappers[action], ...args], { cwd, env: { ...process.env, ...env } });
  return JSON.parse(value.stdout);
}
async function sequence(route, productCount) {
  const root = await mkdtemp(path.join(tmpdir(), "hr-h041-cli-"));
  try {
    const env = { H041_FIXTURE_ROUTE: route, H041_FIXTURE_PRODUCTS: String(productCount) };
    const initialized = await shell(root, "init", ["--artifact=mer_histbootstrap_fixture", "--initialized-by=operator:fixture", "--confirmation=fixture"], env);
    assert.equal(initialized.providerTasksCreated, 0);
    assert.equal(initialized.cohortSize, productCount);
    let inspected = await shell(root, "inspect", ["--checkpoint=mer_histbootcp_fixture"], env);
    assert.equal(inspected.lifecycleState, "READY_FOR_PAID_TASK");
    const operations = route === "ESCALATION" ? ["PRODUCTS", "PRODUCT_INFO", "SELLERS"] : ["PRODUCTS", "SELLERS"];
    for (const operation of operations) {
      const authorized = await shell(root, "authorize-next", ["--checkpoint=mer_histbootcp_fixture", "--authorized-by=operator:fixture", "--reason=fixture", `--confirmation=AUTHORIZE-${operation}-mer_histbootcp_fixture`], env);
      const authorization = authorized.result.continuationAuthorizationId;
      await shell(root, "prepare-next", ["--checkpoint=mer_histbootcp_fixture", `--authorization=${authorization}`], env);
      const executed = await shell(root, "execute-next", ["--checkpoint=mer_histbootcp_fixture", `--authorization=${authorization}`, "--executed-by=operator:fixture", `--confirmation=EXECUTE-${operation}-mer_histbootcp_fixture`], env);
      assert.equal(executed.paidTaskCreated, true);
      assert.equal(executed.actualSpendUsd, 0.001);
      assert.equal((await shell(root, "retrieve", ["--checkpoint=mer_histbootcp_fixture"], env)).actualSpendUsd, 0);
      await shell(root, "process", ["--checkpoint=mer_histbootcp_fixture"], env);
    }
    inspected = await shell(root, "inspect", ["--checkpoint=mer_histbootcp_fixture"], env);
    return inspected;
  } finally { await rm(root, { recursive: true, force: true }); }
}
const direct = await sequence("DIRECT", 1);
assert.equal(direct.lifecycleState, "COHORT_COMPLETE");
assert.equal(direct.tasksUsed, 2);
assert.equal(direct.cohortSpendUsd, 0.002);
const escalation = await sequence("ESCALATION", 1);
assert.equal(escalation.lifecycleState, "COHORT_COMPLETE");
assert.equal(escalation.tasksUsed, 3);
assert.equal(escalation.cohortSpendUsd, 0.003);
const genericRoot = await mkdtemp(path.join(tmpdir(), "hr-h041-generic-"));
try { assert.equal((await shell(genericRoot, "init", ["--artifact=generic", "--initialized-by=operator:fixture", "--confirmation=fixture"], { H041_FIXTURE_PRODUCTS: "5" })).cohortSize, 5); }
finally { await rm(genericRoot, { recursive: true, force: true }); }

console.log("Historical bootstrap operator command tests passed (55 cases).");
