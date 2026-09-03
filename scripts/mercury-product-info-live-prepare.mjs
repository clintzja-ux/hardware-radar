import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  createProductInfoEnrichmentAuthorizationRequest,
  extractReviewedProductEnrichmentProposal,
  FileAcquisitionExecutionLedgerRepository,
  readGovernedSpendForUtcDay
} from '../packages/mercury/index.js';

const stateRoot = path.resolve('.forge-review/acquisition');
const envelope = JSON.parse(
  await readFile(path.join(stateRoot, 'product-enrichment-proposal.json'), 'utf8')
);
const proposal = extractReviewedProductEnrichmentProposal(envelope);
const createdAt = new Date().toISOString();
const executionRepository = new FileAcquisitionExecutionLedgerRepository({ filePath: path.join(stateRoot, 'execution-ledger.json') });
const spentTodayUsd = await readGovernedSpendForUtcDay({ executionRepository, evaluationTime: createdAt });
const request = createProductInfoEnrichmentAuthorizationRequest({ proposal, createdAt, spentTodayUsd });
const out = path.join(stateRoot, 'product-info-authorization-request.json');
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(request, null, 2) + '\n');

console.log('PRODUCT INFO LIVE PREPARE');
console.log('API call:             NONE');
console.log('Actual spend:         $0.000');
console.log('Proposal ID:          ', request.proposalId);
console.log('Plan ID:              ', request.planId);
console.log('Authorization ID:     ', request.requestId);
console.log('Source PRODUCTS task: ', request.sourceTaskId);
console.log('Atlas product:        ', request.atlasProductId);
console.log('Data docid:           ', request.providerIdentity.dataDocId);
console.log('Approved tasks:        1');
console.log('Maximum spend:        $0.001');
console.log('Current-day spend:   ', `$${spentTodayUsd.toFixed(3)}`);
console.log('Daily maximum:        $0.010');
console.log('Projected daily:     ', `$${(spentTodayUsd + .001).toFixed(3)}`);
console.log('Remaining after task:', `$${(.01 - spentTodayUsd - .001).toFixed(3)}`);
console.log('Automatic retries:     0');
console.log('Status:                PENDING_OPERATOR_APPROVAL');
console.log('Request export:       .forge-review\\acquisition\\product-info-authorization-request.json');
