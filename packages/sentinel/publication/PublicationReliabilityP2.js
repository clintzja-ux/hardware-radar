const freeze = value => Object.freeze(structuredClone(value));
const terminal = new Set(["LIVE_ACCEPTED", "FAILED", "NO_MEANINGFUL_CHANGE"]);
const jamaicaDay = value => new Intl.DateTimeFormat("en-CA", {timeZone:"America/Jamaica",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));
const records = state => [...(state?.operations??[]),...(state?.recoveries??[]),...(state?.reconsiderations??[])];
const recordTime = record => record?.acceptedAt??record?.events?.at(-1)?.at??"";
const checkpointOf = record => record?.checkpointCommit??record?.events?.findLast?.(event=>event.type==="CHECKPOINT_CREATED")?.evidence?.commit??record?.events?.findLast?.(event=>["LIVE_ACCEPTED","RECOVERY_LIVE_ACCEPTED","RECONSIDERATION_OBSERVATION_RECOVERY_LIVE_ACCEPTED"].includes(event.type))?.evidence?.checkpointCommit??null;
const releaseOf = record => record?.releaseId??record?.events?.findLast?.(event=>["LIVE_ACCEPTED","RECOVERY_LIVE_ACCEPTED","RECONSIDERATION_OBSERVATION_RECOVERY_LIVE_ACCEPTED"].includes(event.type))?.evidence?.releaseId??null;
const deploymentOf = record => record?.deploymentId??record?.events?.findLast?.(event=>["LIVE_ACCEPTED","RECOVERY_LIVE_ACCEPTED","RECONSIDERATION_OBSERVATION_RECOVERY_LIVE_ACCEPTED"].includes(event.type))?.evidence?.deploymentId??null;

export function classifyPublicationArtifactChange({changedPaths,comparisonComplete}={}) {
  if(comparisonComplete!==true||!Array.isArray(changedPaths))throw new Error("PUBLICATION_ARTIFACT_COMPARISON_INCOMPLETE");
  const normalized=changedPaths.map(value=>String(value).replaceAll("\\","/").replace(/^\.\//,""));
  if(normalized.some(value=>!value||value.startsWith("/")||value.includes(".."))||new Set(normalized).size!==normalized.length)throw new Error("PUBLICATION_ARTIFACT_INVENTORY_INVALID");
  const paths=[...normalized].sort();
  return freeze({schemaVersion:"1.0",status:paths.length?"MEANINGFUL_CHANGE":"NO_MEANINGFUL_CHANGE",comparisonComplete:true,paths,pathCount:paths.length});
}

export function projectPublicationReliabilityStatus({state,currentCodeHead,publishedCheckpoint=null,asOf}={}) {
  if(!state||!Number.isFinite(Date.parse(asOf??"")))throw new Error("PUBLICATION_STATUS_EVIDENCE_INCOMPLETE");
  if(typeof currentCodeHead!=="string"||!currentCodeHead)throw new Error("PUBLICATION_STATUS_CODE_HEAD_REQUIRED");
  const all=records(state),accepted=all.filter(record=>record?.status==="LIVE_ACCEPTED").sort((a,b)=>recordTime(a).localeCompare(recordTime(b))),latestAccepted=accepted.at(-1)??null;
  const active=all.filter(record=>record?.status&&!terminal.has(record.status)).sort((a,b)=>recordTime(a).localeCompare(recordTime(b))).at(-1)??null;
  const failedWithDeployment=[...all].reverse().find(record=>record?.status==="FAILED"&&record?.events?.some(event=>event.type==="MAIN_UPDATED"))??null;
  const effectiveCheckpoint=publishedCheckpoint??checkpointOf(latestAccepted)??checkpointOf(failedWithDeployment);
  const enabledMandate=[...(state.mandates??[])].filter(mandate=>mandate?.status==="ENABLED"&&Date.parse(asOf)>=Date.parse(mandate.validFrom)&&Date.parse(asOf)<Date.parse(mandate.expiresAt)).sort((a,b)=>String(a.expiresAt).localeCompare(String(b.expiresAt))).at(-1)??null;
  const localDay=jamaicaDay(asOf),acceptedToday=accepted.filter(record=>record.localDay===localDay).length,dailyMaximum=enabledMandate?.maximumAcceptedReleasesPerLocalDay??0,allowance=Math.max(0,dailyMaximum-acceptedToday);
  const latestRecovery=[...(state.recoveries??[])].sort((a,b)=>recordTime(a).localeCompare(recordTime(b))).at(-1)??null;
  const liveNotAccepted=Boolean(failedWithDeployment&&(!latestAccepted||Date.parse(recordTime(failedWithDeployment))>Date.parse(recordTime(latestAccepted))));
  const nextSafeOperatorAction=active?"INSPECT_ACTIVE_PUBLICATION":liveNotAccepted?"INSPECT_GOVERNED_RECOVERY":allowance===0?"WAIT_FOR_DAILY_ALLOWANCE":enabledMandate?"PREFLIGHT_NEXT_PUBLICATION":"CREATE_OR_ENABLE_PUBLICATION_MANDATE";
  return freeze({schemaVersion:"1.0",status:"PUBLICATION_STATUS_PROJECTED",asOf,latestAcceptedDataRelease:latestAccepted?{releaseId:releaseOf(latestAccepted),checkpointCommit:checkpointOf(latestAccepted),deploymentId:deploymentOf(latestAccepted),acceptedAt:recordTime(latestAccepted),sourceId:latestAccepted.recoveryId??latestAccepted.reconsiderationId??latestAccepted.candidateId??null}:null,publishedCheckpoint:effectiveCheckpoint,currentCodeHead,codeHeadDiffersFromPublishedCheckpoint:Boolean(effectiveCheckpoint&&effectiveCheckpoint!==currentCodeHead),activePublicationStage:active?.status??"IDLE",activePublicationIdentity:active?.recoveryId??active?.reconsiderationId??active?.candidateId??null,recoveryStatus:latestRecovery?{recoveryId:latestRecovery.recoveryId??null,status:latestRecovery.status,recoveryType:latestRecovery.recoveryType??"PRE_PUSH"}:null,dailyAcceptedReleaseAllowance:{localDay,maximum:dailyMaximum,consumed:acceptedToday,remaining:allowance},deploymentLiveButNotGovernedAccepted:liveNotAccepted,nextSafeOperatorAction});
}
