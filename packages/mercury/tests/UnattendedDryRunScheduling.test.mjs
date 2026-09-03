import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const files=['scripts/windows/mercury-dry-run-task.ps1','scripts/windows/install-mercury-dry-run-task.ps1'];
const [runner,installer]=await Promise.all(files.map(f=>readFile(new URL(`../../../${f}`,import.meta.url),'utf8')));
assert.match(runner,/npm run acquisition:dry-run/);
assert.doesNotMatch(runner,/dataforseo|LIVE|API_PASSWORD|API_LOGIN/i);
assert.match(
  installer,
  /RepetitionInterval\s+\(New-TimeSpan\s+-Hours\s+6\)/
);
assert.match(
  installer,
  /RepetitionDuration\s+\(New-TimeSpan\s+-Days\s+3650\)/
);
assert.match(installer,/MultipleInstances IgnoreNew/);
assert.match(installer,/StartWhenAvailable/);
assert.match(installer,/mercury-dry-run-task\.ps1/);
assert.doesNotMatch(installer,/dataforseo|acquisition:live|API_PASSWORD|API_LOGIN/i);
console.log('DF004-E1.2 unattended dry-run scheduling contract passed.');
