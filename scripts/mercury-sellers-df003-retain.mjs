import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  createProductionDataForSeoRetrievalOwner,
  createProductionSellersDf003ProcessingOwner
} from '../packages/mercury/index.js';

const args = new Map(process.argv.slice(2).map((x) => {
  const i = x.indexOf('=');
  return i < 0 ? [x, true] : [x.slice(0, i), x.slice(i + 1)];
}));
const sellersTaskId = args.get('--sellers-task-id');
const productInfoTaskId = args.get('--product-info-task-id');
if (typeof sellersTaskId !== 'string') throw new Error('SELLERS_TASK_ID_REQUIRED');

const stateRoot = path.resolve('.forge-review/acquisition');
const prepared = JSON.parse(await readFile(path.join(stateRoot, 'sellers-enrichment-proposal.json'), 'utf8'));
const sellersProposal = prepared.proposal ?? prepared;
const direct = sellersProposal.identityLineageType === 'DIRECT_PRODUCTS_STRONG_IDENTITY';
if (!direct && typeof productInfoTaskId !== 'string') throw new Error('PRODUCT_INFO_TASK_ID_REQUIRED');
if (direct && productInfoTaskId != null) throw new Error('DIRECT_PRODUCTS_LINEAGE_REJECTS_PRODUCT_INFO_TASK');
const sellersRetrieval=createProductionDataForSeoRetrievalOwner({operation:'SELLERS'}),productInfoRetrieval=createProductionDataForSeoRetrievalOwner({operation:'PRODUCT_INFO'});
const sellersResult = await sellersRetrieval.retrieve({providerTaskId:sellersTaskId});
const productInfoResult = direct ? null : await productInfoRetrieval.retrieve({providerTaskId:productInfoTaskId});
const evidencePath = process.env.HARDWARE_RADAR_DATAFORSEO_EVIDENCE_STATE
  ? path.resolve(process.env.HARDWARE_RADAR_DATAFORSEO_EVIDENCE_STATE)
  : path.join(stateRoot, 'dataforseo-market-evidence.json');
const processed=await createProductionSellersDf003ProcessingOwner({stateRoot,evidencePath}).process({sellersTaskId,productInfoTaskId,sellersResult,productInfoResult});
const {result,governance,lineage}=processed;

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
