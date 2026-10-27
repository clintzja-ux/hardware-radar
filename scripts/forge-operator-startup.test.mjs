import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { request } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const entry = path.join(root, "scripts", "serve-forge-operator-preview.mjs");
const launcher = await readFile(path.join(root, "scripts", "windows", "start-hardware-radar-forge.ps1"), "utf8");
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
assert.match(launcher, /FORGE_OPERATOR_TRUSTED_LAUNCH/);
assert.match(launcher, /--env-file=\.env/);
assert.match(pkg.scripts["forge:operator"], /^node --env-file=\.env /);

const port = 43_000 + (process.pid % 1_000);
const child = spawn(process.execPath, [entry], { cwd: root, env: { ...process.env, FORGE_OPERATOR_ID: "operator:startup-test", FORGE_OPERATOR_TRUSTED_LAUNCH: "1", FORGE_OPERATOR_PREVIEW_PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"] });
let output = "";
child.stdout.on("data", chunk => output += chunk);
child.stderr.on("data", chunk => output += chunk);
const exited = new Promise(resolve => child.once("exit", (code, signal) => resolve({ code, signal })));
const waitFor = async (check, timeout = 10_000) => { const started = Date.now(); while (Date.now() - started < timeout) { const value = check(); if (value) return value; await new Promise(resolve => setTimeout(resolve, 25)); } throw new Error(`FORGE_STARTUP_TEST_TIMEOUT:${output}`); };
const httpGet = (url, headers = {}) => new Promise((resolve, reject) => { const call = request(url, { method: "GET", headers }, response => { let body = ""; response.on("data", chunk => body += chunk); response.on("end", () => resolve({ status: response.statusCode, headers: response.headers, body })); }); call.on("error", reject); call.end(); });

try {
  const url = await waitFor(() => /http:\/\/127\.0\.0\.1:\d+\//.exec(output)?.[0]);
  const health = await fetch(`${url}operator-api/health`).then(response => response.json());
  assert.equal(health.mode, "TRUSTED");
  assert.deepEqual(health.capabilities, ["MANUAL_CURRENT_PRICE_PROCESS"]);
  const launched = await httpGet(url, { "Sec-Fetch-Site": "none", "Sec-Fetch-Mode": "navigate", "Sec-Fetch-Dest": "document" });
  const cookie = launched.headers["set-cookie"]?.[0];
  assert.ok(cookie?.includes("forge_session="));
  const session = await httpGet(`${url}operator-api/session`, { cookie: cookie.split(";")[0], referer: url });
  assert.equal(session.status, 200);
  const sessionValue = JSON.parse(session.body);
  assert.equal(sessionValue.operatorId, "operator:startup-test");
  const options = await httpGet(`${url}operator-api/manual-price/options`, { cookie: cookie.split(";")[0], origin: url.slice(0, -1), "x-forge-csrf": sessionValue.csrf });
  assert.equal(options.status, 200);
  assert.ok(Array.isArray(JSON.parse(options.body).products));
  const unauthorized = await httpGet(`${url}operator-api/manual-price/options`);
  assert.equal(unauthorized.status, 401);
} finally { child.kill("SIGTERM"); }
const stopped = await exited;
assert.ok(stopped.code === 0 || stopped.signal === "SIGTERM");
console.log("Forge operator startup composition tests passed: reduced trusted launch, session, CSRF, manual-price options, and unauthorized rejection.");
