import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { RetailerRepository, FileAtlasCatalogAdministrationRepository } from "../packages/atlas/index.js";
import { ProductionFlatRetailerDestinationRepository, ForgeTrustedOperatorService, ForgeTrustedOperatorHttpRuntime, FileForgeOperatorAuditRepository, GovernedRetailerLinkVerificationService, FileHistoricalObservationRepository, createForgeProductManagerProjection } from "../packages/mercury/index.js";
import { FileCurrentDisplaySnapshotRepository, ManualCurrentPriceAffiliateWorkbookRepository, readManualCurrentPriceWorkbookRows } from "../packages/mercury/current-display/index.js";
import { loadRetailerDestinationSource } from "../packages/mercury/destinations/RetailerDestinationSource.js";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const runtimeRevision = (() => { try { return execFileSync("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot, encoding: "utf8", windowsHide: true }).trim(); } catch { return "UNKNOWN"; } })();
const forgeRoot = join(repositoryRoot, "apps", "forge");
const publicImages = join(repositoryRoot, "public", "images");
const operatorData = new Map([
    ["/operator-data/product-manager.json", join(repositoryRoot, ".forge-review", "forge", "product-manager.json")],
    ["/operator-data/certified-mercury-operations.json", join(repositoryRoot, ".forge-review", "forge", "certified-mercury-operations.json")]
]);
const mime = new Map([[".html", "text/html; charset=utf-8"], [".js", "text/javascript; charset=utf-8"], [".css", "text/css; charset=utf-8"], [".json", "application/json; charset=utf-8"], [".svg", "image/svg+xml"], [".ico", "image/x-icon"], [".png", "image/png"]]);
const port = Number(process.env.FORGE_OPERATOR_PREVIEW_PORT ?? 4174);
const operatorId=process.env.FORGE_OPERATOR_ID?.trim()??null;
let trustedRuntime=null;
let liveProductProjection=null;
let fixtureMode=false;
if(operatorId){
    const fixtureRoot = process.env.FORGE_OPERATOR_FIXTURE_ROOT ? resolve(process.env.FORGE_OPERATOR_FIXTURE_ROOT) : null;
    if (fixtureRoot && !within(repositoryRoot, fixtureRoot)) throw new Error("FORGE_OPERATOR_FIXTURE_ROOT_MUST_BE_INSIDE_REPOSITORY");
    fixtureMode=Boolean(fixtureRoot);
    const atlasRoot = fixtureRoot ? join(fixtureRoot, "atlas") : join(repositoryRoot, "packages", "atlas");
    const destinationPath = fixtureRoot ? join(fixtureRoot, "production-destinations.json") : join(repositoryRoot, "packages", "mercury", "destinations", "production-destinations.json");
    const workbookPath = fixtureRoot ? join(fixtureRoot, "manual-price-workbook.xlsx") : join(repositoryRoot, ".forge-review", "retail-display", "hardware-radar-amazon-newegg-manual-price-research-with-rakuten.xlsx");
    const currentPath = fixtureRoot ? join(fixtureRoot, "current-display-snapshots.json") : join(repositoryRoot, ".forge-review", "retail-display", "current-display-snapshots.json");
    const historyPath = fixtureRoot ? join(fixtureRoot, "historical-observations.json") : join(repositoryRoot, ".forge-review", "mercury", "historical-observations.json");
    const auditPath = fixtureRoot ? join(fixtureRoot, "operator-audit.json") : join(repositoryRoot, ".forge-review", "forge", "operator-audit.json");
    const readJson=async resource=>JSON.parse(await readFile(resource instanceof URL?fileURLToPath(resource):resource,"utf8"));
    const retailerReader=new RetailerRepository({readJson});
    const catalogWriter=new FileAtlasCatalogAdministrationRepository({atlasRoot});
    const catalogRepository={getAll:()=>catalogWriter.getAll(),getBrands:()=>catalogWriter.getBrands(),getById:id=>catalogWriter.getById(id),registerBrand:value=>catalogWriter.registerBrand(value),createProduct:value=>catalogWriter.createProduct(value),updateProduct:(value,options)=>catalogWriter.updateProduct(value,options)};
    const destinationRepository=new ProductionFlatRetailerDestinationRepository({statePath:destinationPath,productRepository:catalogRepository,retailerRepository:retailerReader});
    const auditRepository=new FileForgeOperatorAuditRepository({statePath:auditPath});
    const linkVerifier=new GovernedRetailerLinkVerificationService({request:fetch});
    const affiliateOwner=new ManualCurrentPriceAffiliateWorkbookRepository({workbookPath,productRepository:catalogRepository,destinationRepository});
    const service=new ForgeTrustedOperatorService({catalogRepository,destinationRepository,affiliateOwner,linkVerifier,auditRepository});
    trustedRuntime=new ForgeTrustedOperatorHttpRuntime({service,operatorId,allowedOrigin:`http://127.0.0.1:${port}`,trustedLaunch:process.env.FORGE_OPERATOR_TRUSTED_LAUNCH==="1"});
    liveProductProjection=async()=>{const products=await catalogRepository.getAll(),brands=await catalogRepository.getBrands(),retailers=await retailerReader.getAll(),destinationSource=await loadRetailerDestinationSource({sourcePath:destinationPath,products,retailers}),current=(await new FileCurrentDisplaySnapshotRepository({statePath:currentPath}).getState()).current,history=await new FileHistoricalObservationRepository({statePath:historyPath}).getAll();let affiliateRows=[];try{affiliateRows=await readManualCurrentPriceWorkbookRows({workbookPath});}catch(error){if(error.code!=="ENOENT")throw error;}return createForgeProductManagerProjection({asOf:new Date().toISOString(),products,brands,retailers,destinationSource,currentSnapshot:current,historicalObservations:history,affiliateRows});};
}

function within(root, target) { const value = relative(root, target); return value !== "" && !value.startsWith("..") && !value.includes(`..${process.platform === "win32" ? "\\" : "/"}`); }
function targetFor(url) {
    if (operatorData.has(url.pathname)) return operatorData.get(url.pathname);
    if (url.pathname.startsWith("/images/")) { const target = resolve(publicImages, `.${normalize(url.pathname.slice("/images".length))}`); return within(publicImages, target) ? target : null; }
    const requestPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const target = resolve(forgeRoot, `.${normalize(requestPath)}`);
    return within(forgeRoot, target) ? target : null;
}

const server = createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    if(trustedRuntime&&request.url==="/"&&request.method==="GET")trustedRuntime.establishTrustedLaunch(fixtureMode?{method:request.method,url:request.url,headers:{...request.headers,"sec-fetch-site":"none","sec-fetch-mode":"navigate","sec-fetch-dest":"document"}}:request,response);
    if(request.url==="/operator-api/health"&&request.method==="GET"){response.writeHead(200,{"Content-Type":"application/json; charset=utf-8"});return response.end(JSON.stringify({status:"READY",mode:trustedRuntime?"TRUSTED":"READ_ONLY",loopback:true,runtimeRevision,processId:process.pid}));}
    if(trustedRuntime&&request.url.startsWith("/operator-api/")){await trustedRuntime.handle(request,response);return;}
    if(liveProductProjection&&new URL(request.url,"http://127.0.0.1").pathname==="/operator-data/product-manager.json"){if(!["GET","HEAD"].includes(request.method)){response.writeHead(405);return response.end();}const body=JSON.stringify(await liveProductProjection());response.writeHead(200,{"Content-Type":"application/json; charset=utf-8"});return response.end(request.method==="HEAD"?undefined:body);}
    if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405, { Allow: "GET, HEAD" }); return response.end("Operator API unavailable"); }
    const target = targetFor(new URL(request.url, "http://127.0.0.1"));
    try {
        if (!target) throw new Error("Not found"); await access(target); if (!(await stat(target)).isFile()) throw new Error("Not found");
        response.writeHead(200, { "Content-Type": mime.get(extname(target).toLowerCase()) ?? "application/octet-stream" });
        if (request.method === "HEAD") return response.end(); createReadStream(target).pipe(response);
    } catch { response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); response.end("Not found"); }
});

server.listen(port, "127.0.0.1", () => {
    const actualPort=server.address().port;
    console.log(trustedRuntime?`Forge trusted operator: http://127.0.0.1:${actualPort}/`:`Forge operator preview: http://127.0.0.1:${actualPort}/`);
    console.log(trustedRuntime?`Authenticated operator: ${operatorId}. Loopback only. Press Ctrl+C to stop.`:"Read-only loopback server. Press Ctrl+C to stop.");
});
for(const signal of ["SIGINT","SIGTERM"])process.once(signal,()=>server.close(()=>process.exit(0)));
