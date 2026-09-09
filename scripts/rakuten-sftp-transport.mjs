import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRakutenSftpConfig, NativeSftpSession, RakutenProductCatalogSftpTransport } from "../packages/mercury/current-display/index.js";

const args=new Map(process.argv.slice(2).map(value=>{const i=value.indexOf("=");return i<0?[value,true]:[value.slice(0,i),value.slice(i+1)];}));
const operation=args.get("--operation");
if(!["inspect","download-delta"].includes(operation))throw new Error("SFTP_OPERATION_INVALID");
if(args.get("--confirm-host-key")!=="TRUST-RAKUTEN-HOST-ON-FIRST-USE")throw new Error("SFTP_HOST_VERIFICATION_REQUIRED");
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const config=loadRakutenSftpConfig();
const sessionFactory=({connectionAccounting})=>new NativeSftpSession({config,knownHostsPath:path.join(root,".forge-review","rakuten-sftp","known_hosts"),trustOnFirstUse:true,connectionAccounting});
const transport=new RakutenProductCatalogSftpTransport({sessionFactory,stagingRoot:path.join(root,".forge-review","rakuten-sftp","staging"),connectionConcurrency:config.concurrency,maxAttempts:1});
let result;try{result=operation==="inspect"?await transport.inspect():await transport.downloadAndValidate();}catch(error){console.error("RAKUTEN PRODUCT CATALOG SFTP TRANSPORT");console.error("Operation:                   ",error.code??"SFTP_OPERATION_FAILED");printDiscovery(error.discovery);printAccounting(error.connectionAccounting);console.error("Actual spend:                $0.000");process.exitCode=1;throw error;}
function printAccounting(value={}){console.log("Connection accounting:");console.log("  opened:                    ",value.connectionsOpened??0);console.log("  ready:                     ",value.connectionsReady??0);console.log("  closed gracefully:         ",value.connectionsClosedGracefully??0);console.log("  destroyed as fallback:     ",value.connectionsDestroyedAsFallback??0);console.log("  active at start:           ",value.activeConnectionsAtStart??0);console.log("  active at end:             ",value.activeConnectionsAtEnd??0);console.log("  peak local concurrent:     ",value.peakLocalConcurrentConnections??0);}
function printDiscovery(value){if(!value)return;console.log("File discovery:");console.log("  logical directory:         ",value.logicalDirectory);console.log("  entries observed:          ",value.entriesObserved);console.log("  directories observed:      ",value.directoriesObserved);console.log("  regular files observed:    ",value.regularFilesObserved);console.log("  recognized feed files:     ",value.recognizedFeedFiles);console.log("  main delta candidates:     ",value.mainDeltaCandidates);console.log("  target MID:                ",value.targetMid);console.log("  recognized entries:        ",value.recognizedEntries.join(", "));}
console.log("RAKUTEN PRODUCT CATALOG SFTP TRANSPORT");
console.log("Operation:                  ",operation.toUpperCase());
console.log("Host:                       ",config.host);
console.log("Port:                       ",config.port);
console.log("Selected file:              ",result.selected.filename);
console.log("Feed family:                ",result.selected.feedFamily);
console.log("Advertiser MID:             ",result.selected.advertiserMid);
console.log("Publisher SID:              ",result.selected.publisherSid);
console.log("Remote timestamp (UTC):     ",result.selected.remoteTimestampUtc);
console.log("Reported remote bytes:      ",`${result.selected.size} (informational only)`);
console.log("Downloaded:                 ",result.downloaded===false?"NO":"YES");
if(result.status==="DOWNLOADED_AND_VALIDATED"){
 console.log("Header timestamp:           ",result.headerTimestamp);console.log("Product rows:               ",result.productRows);console.log("Trailer rows:               ",result.trailerRows);console.log("Modification I/U/D:         ",`${result.modifications.I}/${result.modifications.U}/${result.modifications.D}`);console.log("Field counts:               ",result.fieldCounts.join(", "));console.log("Gzip/parser integrity:      PASS");
}
console.log("Username:                    REDACTED");
console.log("Current-display mutation:    NONE");
console.log("Historical mutation:         NONE");
console.log("Affiliate routing:           NONE");
console.log("SFTP connections:           ",result.connectionsUsed);
printDiscovery(result.discovery);
printAccounting(result.connectionAccounting);
console.log("Actual spend:                $0.000");
