import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ProductRepository,
  RetailerRepository
} from '../packages/atlas/index.js';
import {
  DataForSeoMerchantApiClient,
  DataForSeoAcquisitionService,
  DataForSeoAtlasResolver,
  DataForSeoAcquisitionResultProcessor,
  FileDataForSeoMarketEvidenceRepository,
  SellersResultDf003RetentionService,
  loadDataForSeoCredentials
} from '../packages/mercury/index.js';

const args = new Map(process.argv.slice(2).map((x) => {
  const i = x.indexOf('=');
  return i < 0 ? [x, true] : [x.slice(0, i), x.slice(i + 1)];
}));
const sellersTaskId = args.get('--sellers-task-id');
const productInfoTaskId = args.get('--product-info-task-id');
if (typeof sellersTaskId !== 'string') throw new Error('SELLERS_TASK_ID_REQUIRED');
if (typeof productInfoTaskId !== 'string') throw new Error('PRODUCT_INFO_TASK_ID_REQUIRED');

const stateRoot = path.resolve('.forge-review/acquisition');
const sellersAuthorization = JSON.parse(await readFile(path.join(stateRoot, 'sellers-authorization-request.json'), 'utf8'));
if (sellersAuthorization.authorizationType !== 'SELLERS_ENRICHMENT') throw new Error('SELLERS_AUTHORIZATION_REQUIRED');
if (sellersAuthorization.sourceProductInfoTaskId !== productInfoTaskId) throw new Error('PRODUCT_INFO_TASK_PROVENANCE_MISMATCH');

const executionLedger = JSON.parse(await readFile(path.join(stateRoot, 'execution-ledger.json'), 'utf8'));
const sellerRun = executionLedger.runs?.find((run) => run.tasks?.some((task) => task.providerTaskId === sellersTaskId));
const sellerTask = sellerRun?.tasks?.find((task) => task.providerTaskId === sellersTaskId);
if (!sellerRun || !sellerTask || sellerTask.outcome !== 'COMPLETED') throw new Error('SELLERS_EXECUTION_LEDGER_RECORD_REQUIRED');
if (sellerRun.planId !== sellersAuthorization.planId) throw new Error('SELLERS_PLAN_PROVENANCE_MISMATCH');

const credentials = loadDataForSeoCredentials();
const transport = async ({ method, url, headers, body }) => {
  const response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return data;
};
const client = new DataForSeoMerchantApiClient({ login: credentials.login, password: credentials.password, transport });
const acquisition = new DataForSeoAcquisitionService({ client });
const [sellersResult, productInfoResult] = await Promise.all([
  acquisition.getSellersResult(sellersTaskId),
  acquisition.getProductInfoResult(productInfoTaskId)
]);
if (Number(sellersResult?.cost ?? 0) !== 0 || Number(productInfoResult?.cost ?? 0) !== 0) throw new Error('DF003_RETENTION_RETRIEVAL_MUST_BE_ZERO_COST');

const readLocalJson = async (resource) => JSON.parse(await readFile(resource, 'utf8'));
const productRepository = new ProductRepository({ readJson: readLocalJson });
const retailerRepository = new RetailerRepository({ readJson: readLocalJson });
const atlasResolver = new DataForSeoAtlasResolver({ productRepository });
const evidencePath = process.env.HARDWARE_RADAR_DATAFORSEO_EVIDENCE_STATE
  ? path.resolve(process.env.HARDWARE_RADAR_DATAFORSEO_EVIDENCE_STATE)
  : path.join(stateRoot, 'dataforseo-market-evidence.json');
const evidenceRepository = new FileDataForSeoMarketEvidenceRepository({ statePath: evidencePath });
const resultProcessor = new DataForSeoAcquisitionResultProcessor({
  atlasResolver,
  evidenceRepository,
  retailers: async () => retailerRepository.getAll()
});
const retention = new SellersResultDf003RetentionService({ resultProcessor });
const result = await retention.retain({
  sellersResult,
  productInfoResult,
  sellersTaskId,
  productInfoTaskId,
  observedAt: sellerRun.finishedAt,
  providerIdentity: sellersAuthorization.providerIdentity,
  candidateId: sellerTask.candidateId
});

const out = path.join(stateRoot, 'sellers-df003-retention-latest.json');
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(result, null, 2) + '\n');
const first = result.integrations[0] ?? null;
console.log('SELLERS RESULT → DF003 RETENTION');
console.log('Sellers task:             ', sellersTaskId);
console.log('Product Info task:        ', productInfoTaskId);
console.log('Seller items:             ', result.sellerItems);
console.log('Evidence retained:        ', result.retained);
console.log('Duplicates:               ', result.duplicates);
console.log('Rejected:                 ', result.rejected);
console.log('Product identity:         ', first?.productIdentityOutcome ?? null);
console.log('Merchant identity:        ', first?.merchantIdentityOutcome ?? null);
console.log('Historical outcome:       ', first?.historicalOutcome ?? null);
console.log('Canonical eligible:       ', first?.canonicalObservationEligible ?? false);
console.log('Publication eligible:     ', first?.publicationEligible ?? false);
console.log('Paid task created:        NO');
console.log('Actual spend:             $0.000');
console.log('Retention export:         .forge-review\\acquisition\\sellers-df003-retention-latest.json');
console.log('Evidence state:           ', path.relative(process.cwd(), evidencePath));
