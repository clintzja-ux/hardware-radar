import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";

const root=path.resolve(new URL("../../..",import.meta.url).pathname.slice(1)),canonicalPath=path.join(root,"apps/forge/components/NeweggMandatePanel.js"),publicPath=path.join(root,"public/forge/components/NeweggMandatePanel.js"),[canonical,published,styles]=await Promise.all([readFile(canonicalPath,"utf8"),readFile(publicPath,"utf8"),readFile(path.join(root,"apps/forge/styles.css"),"utf8")]);
assert.equal(published,canonical,"canonical and public Forge operation panels must stay synchronized");
for(const text of ["Current operation","Recent Operations","Canonical operation","Provider transfer","Acquisition lease","Current / History","QA / Sentinel","Publication","Authoritative source","SFTP_DNS_FAILED","Deployment observation is pending","Accepted for governed dispatch"] )assert.match(canonical,new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
assert.match(canonical,/Promise\.all\(\[fetch\("\/operator-api\/newegg-mandates"/);
assert.match(canonical,/fetch\("\/operator-api\/newegg-operations"/);
assert.doesNotMatch(canonical,/Math\.round\([^\n]*100|progress[^\n]*%/i,"the UI must not invent completion percentages");
assert.match(canonical,/this\.confirmDialog/);
assert.match(styles,/@media\s*\(max-width:/,"Forge retains a mobile breakpoint");
console.log("Forge operational visibility UI tests passed: persistent status, readable failures, prompt independence, and responsive contract.");
