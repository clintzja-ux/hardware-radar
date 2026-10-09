import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { ProductRepository, RetailerRepository, FileAtlasCatalogAdministrationRepository } from "../packages/atlas/index.js";
import { ProductionFlatRetailerDestinationRepository, ForgeTrustedOperatorService, ForgeTrustedOperatorHttpRuntime, FileForgeOperatorAuditRepository, GovernedRetailerLinkVerificationService, ManualCurrentPriceAffiliateWorkbookRepository, FileCurrentDisplaySnapshotRepository, readManualCurrentPriceWorkbookRows, FileHistoricalObservationRepository, createForgeProductManagerProjection } from "../packages/mercury/index.js";
import { loadRetailerDestinationSource } from "../packages/mercury/destinations/RetailerDestinationSource.js";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
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
if(operatorId){
    const git=(...args)=>execFileSync("git",args,{cwd:repositoryRoot,encoding:"utf8"}).trim(),branch=git("branch","--show-current"),status=git("status","--porcelain"),head=git("rev-parse","HEAD"),upstream=git("rev-parse","@{upstream}");
    if(branch!=="hardware-radar-growth-1"||status||head!==upstream)throw new Error("FORGE_TRUSTED_RUNTIME_REQUIRES_CLEAN_SYNCHRONIZED_GROWTH_BRANCH");
    const readJson=async resource=>JSON.parse(await readFile(resource instanceof URL?fileURLToPath(resource):resource,"utf8")),productReader=new ProductRepository({readJson}),retailerReader=new RetailerRepository({readJson}),catalogWriter=new FileAtlasCatalogAdministrationRepository({atlasRoot:join(repositoryRoot,"packages","atlas")}),catalogRepository={getAll:()=>catalogWriter.getAll(),getBrands:()=>catalogWriter.getBrands(),getById:id=>catalogWriter.getById(id),registerBrand:value=>catalogWriter.registerBrand(value),createProduct:async value=>{const result=await catalogWriter.createProduct(value);productReader.clearCache();return result;},updateProduct:async(value,options)=>{const result=await catalogWriter.updateProduct(value,options);productReader.clearCache();return result;}},destinationPath=join(repositoryRoot,"packages","mercury","destinations","production-destinations.json"),workbookPath=join(repositoryRoot,".forge-review","retail-display","hardware-radar-amazon-newegg-manual-price-research-with-rakuten.xlsx"),destinationRepository=new ProductionFlatRetailerDestinationRepository({statePath:destinationPath,productRepository:productReader,retailerRepository:retailerReader}),auditRepository=new FileForgeOperatorAuditRepository({statePath:join(repositoryRoot,".forge-review","forge","operator-audit.json")}),linkVerifier=new GovernedRetailerLinkVerificationService({request:fetch}),affiliateOwner=new ManualCurrentPriceAffiliateWorkbookRepository({workbookPath,productRepository:catalogRepository,destinationRepository}),service=new ForgeTrustedOperatorService({catalogRepository,destinationRepository,affiliateOwner,linkVerifier,auditRepository});
    trustedRuntime=new ForgeTrustedOperatorHttpRuntime({service,operatorId,allowedOrigin:`http://127.0.0.1:${port}`});
    liveProductProjection=async()=>{const products=await catalogRepository.getAll(),brands=await catalogRepository.getBrands(),retailers=await retailerReader.getAll(),destinationSource=await loadRetailerDestinationSource({sourcePath:destinationPath,products,retailers}),current=(await new FileCurrentDisplaySnapshotRepository({statePath:join(repositoryRoot,".forge-review","retail-display","current-display-snapshots.json")}).getState()).current,history=await new FileHistoricalObservationRepository({statePath:join(repositoryRoot,".forge-review","mercury","historical-observations.json")}).getAll();let affiliateRows=[];try{affiliateRows=await readManualCurrentPriceWorkbookRows({workbookPath});}catch(error){if(error.code!=="ENOENT")throw error;}return createForgeProductManagerProjection({asOf:new Date().toISOString(),products,brands,destinationSource,currentSnapshot:current,historicalObservations:history,affiliateRows});};
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
    console.log(trustedRuntime?`Forge trusted operator: http://127.0.0.1:${port}/#forge-bootstrap=${encodeURIComponent(trustedRuntime.bootstrapToken)}`:`Forge operator preview: http://127.0.0.1:${port}/`);
    console.log(trustedRuntime?`Authenticated operator: ${operatorId}. Loopback only. Press Ctrl+C to stop.`:"Read-only loopback server. Press Ctrl+C to stop.");
});
