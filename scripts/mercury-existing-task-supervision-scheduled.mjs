import {runScheduledExistingTaskSupervision} from "./mercury-existing-task-supervision-scheduled-cli.mjs";
runScheduledExistingTaskSupervision().catch(error=>{console.error(JSON.stringify({status:"FAILED",classification:error.message,receipt:error.receipt??null},null,2));process.exitCode=1;});
