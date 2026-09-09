import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRakutenSftpConfig, OpenSshSftpSession, RakutenProductCatalogSftpTransport } from "../packages/mercury/current-display/index.js";

const args=new Map(process.argv.slice(2).map(value=>{const i=value.indexOf("=");return i<0?[value,true]:[value.slice(0,i),value.slice(i+1)];}));
const operation=args.get("--operation");
if(!["inspect","download-delta"].includes(operation))throw new Error("SFTP_OPERATION_INVALID");
if(args.get("--confirm-host-key")!=="TRUST-RAKUTEN-HOST-ON-FIRST-USE")throw new Error("SFTP_HOST_VERIFICATION_REQUIRED");
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const config=loadRakutenSftpConfig();
const sessionFactory=()=>new OpenSshSftpSession({config,knownHostsPath:path.join(root,".forge-review","rakuten-sftp","known_hosts"),askpassPath:path.join(root,"scripts","rakuten-sftp-askpass.cmd"),trustOnFirstUse:true});
const transport=new RakutenProductCatalogSftpTransport({sessionFactory,stagingRoot:path.join(root,".forge-review","rakuten-sftp","staging"),connectionConcurrency:config.concurrency,maxAttempts:1});
const result=operation==="inspect"?await transport.inspect():await transport.downloadAndValidate();
console.log("RAKUTEN PRODUCT CATALOG SFTP TRANSPORT");
console.log("Operation:                  ",operation.toUpperCase());
console.log("Host:                       ",config.host);
console.log("Port:                       ",config.port);
console.log("Advertiser MID:             ",result.selected.advertiserMid);
console.log("Selected file:              ",result.selected.filename);
console.log("Feed family:                ",result.selected.feedFamily);
console.log("Remote timestamp:           ",result.selected.modifiedAt);
console.log("Reported remote bytes:      ",result.selected.size);
console.log("Downloaded:                 ",result.downloaded===false?"NO":"YES");
if(result.status==="DOWNLOADED_AND_VALIDATED"){
 console.log("Header timestamp:           ",result.headerTimestamp);console.log("Product rows:               ",result.productRows);console.log("Trailer rows:               ",result.trailerRows);console.log("Modification I/U/D:         ",`${result.modifications.I}/${result.modifications.U}/${result.modifications.D}`);console.log("Field counts:               ",result.fieldCounts.join(", "));console.log("Gzip/parser integrity:      PASS");
}
console.log("Username:                    REDACTED");
console.log("Current-display mutation:    NONE");
console.log("Historical mutation:         NONE");
console.log("Affiliate routing:           NONE");
console.log("SFTP connections:           ",result.connectionsUsed);
console.log("Actual spend:                $0.000");
