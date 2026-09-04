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
  FileDataForSeoTaskLedger,
  FileAcquisitionExecutionLedgerRepository,
  FileLiveAuthorizationConsumptionRepository,
  SellersResultDf003RetentionService,
  loadDataForSeoCredentials,
  validateSellersRetentionLineage,
  validateSellersRetentionResults,
  createGovernedInitialAcquisitionIdentityProjection
} from '../packages/mercury/index.js';

const args = new Map(process.argv.slice(2).map((x) => {
  const i = x.indexOf('=');
  return i < 0 ? [x, true] : [x.slice(0, i), x.slice(i + 1)];
}));
const sellersTaskId = args.get('--sellers-task-id');
const productInfoTaskId = args.get('--product-info-task-id');
if (typeof sellersTaskId !== 'string') throw new Error('SELLERS_TASK_ID_REQUIRED');

const stateRoot = path.resolve('.forge-review/acquisition');
const sellersAuthorization = JSON.parse(await readFile(path.join(stateRoot, 'sellers-authorization-request.json'), 'utf8'));
const prepared = JSON.parse(await readFile(path.join(stateRoot, 'sellers-enrichment-proposal.json'), 'utf8'));
const sellersProposal = prepared.proposal ?? prepared;
const direct = sellersProposal.identityLineageType === 'DIRECT_PRODUCTS_STRONG_IDENTITY';
if (!direct && typeof productInfoTaskId !== 'string') throw new Error('PRODUCT_INFO_TASK_ID_REQUIRED');
if (direct && productInfoTaskId != null) throw new Error('DIRECT_PRODUCTS_LINEAGE_REJECTS_PRODUCT_INFO_TASK');
const taskRepository = new FileDataForSeoTaskLedger(path.join(stateRoot, 'dataforseo-task-ledger.json'));
const executionRepository = new FileAcquisitionExecutionLedgerRepository({ filePath: path.join(stateRoot, 'execution-ledger.json') });
const consumptionRepository = new FileLiveAuthorizationConsumptionRepository({ filePath: path.join(stateRoot, 'live-authorization-consumptions.json') });
const lineage = validateSellersRetentionLineage({ sellersTaskId, productInfoTaskId, sellersAuthorization, sellersProposal, taskLedger: taskRepository.getAll(), executionRuns: await executionRepository.getAll(), authorizationConsumptions: await consumptionRepository.getAll() });

const credentials = loadDataForSeoCredentials();
const transport = async ({ method, url, headers, body }) => {
  const response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return data;
};
const client = new DataForSeoMerchantApiClient({ login: credentials.login, password: credentials.password, transport });
const acquisition = new DataForSeoAcquisitionService({ client });
const sellersResult = await acquisition.getSellersResult(sellersTaskId);
const productInfoResult = direct ? null : await acquisition.getProductInfoResult(productInfoTaskId);
if (Number(sellersResult?.cost ?? 0) !== 0 || (!direct && Number(productInfoResult?.cost ?? 0) !== 0)) throw new Error('DF003_RETENTION_RETRIEVAL_MUST_BE_ZERO_COST');
const governance = validateSellersRetentionResults({ lineage, sellersResult, productInfoResult });

const readLocalJson = async (resource) => JSON.parse(await readFile(resource, 'utf8'));
const productRepository = new ProductRepository({ readJson: readLocalJson });
const retailerRepository = new RetailerRepository({ readJson: readLocalJson });
const atlasResolver = new DataForSeoAtlasResolver({ productRepository });
const atlasProduct = await productRepository.loadProduct(lineage.atlasProductId);
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
  observedAt: (await executionRepository.getAll()).find(run => run.runId === lineage.sellersExecutionRunId).finishedAt,
  providerIdentity: sellersAuthorization.providerIdentity,
  candidateId: sellersAuthorization.plan.decisions.find(entry => entry.decision === 'APPROVED').candidateId,
  governedAcquisition: { createProjection: ({ sellerItem, rawPayloadReference }) => createGovernedInitialAcquisitionIdentityProjection({ governance, sellersProposal, atlasProduct, sellerItem, rawPayloadReference }) }
});

const out = path.join(stateRoot, 'sellers-df003-retention-latest.json');
await mkdir(path.dirname(out), { recursive: true });
const sellerItems = sellersResult.result[0].items;
const auditResult = { ...result, governance, atlasProductId: lineage.atlasProductId, providerIdentity: lineage.providerIdentity, merchantOutcomes: result.integrations.map(entry => entry.merchantIdentityOutcome), conditionKnown: sellerItems.map(entry => typeof entry?.product_condition === 'string' && entry.product_condition.trim() !== ''), shippingKnown: sellerItems.map(entry => Number.isFinite(entry?.shipping_price) && entry.shipping_price >= 0) };
await writeFile(out, JSON.stringify(auditResult, null, 2) + '\n');
const first = result.integrations[0] ?? null;
console.log('SELLERS RESULT → DF003 RETENTION');
console.log('Sellers task:             ', sellersTaskId);
console.log('Identity lineage:         ', direct ? 'DIRECT_PRODUCTS_STRONG_IDENTITY' : 'PRODUCT_INFO_VALIDATED');
console.log('Product Info task:        ', productInfoTaskId ?? 'NOT_REQUIRED');
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
