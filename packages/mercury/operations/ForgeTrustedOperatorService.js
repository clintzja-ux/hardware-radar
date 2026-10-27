import crypto from "node:crypto";

const ACTION = "PROCESS_MANUAL_CURRENT_PRICE";
const hash = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

export class ForgeTrustedOperatorService {
  constructor({ auditRepository, manualPriceEntryService, now = () => new Date().toISOString() } = {}) {
    if (!auditRepository?.getAll || !auditRepository?.record || !manualPriceEntryService?.options || !manualPriceEntryService?.submit) throw new TypeError("FORGE_TRUSTED_RUNTIME_OWNERS_REQUIRED");
    Object.assign(this, { auditRepository, manualPriceEntryService, now });
  }

  _authorize(context, request) {
    if (!context?.authenticated || !context.operatorId) throw new Error("FORGE_OPERATOR_UNAUTHORIZED");
    if (context.allowedActions && !context.allowedActions.includes(ACTION)) throw new Error("FORGE_OPERATOR_ACTION_FORBIDDEN");
    if (request?.action !== ACTION || request.confirmation !== `CONFIRM ${ACTION}`) throw new Error("FORGE_OPERATOR_CONFIRMATION_REQUIRED");
    if (!/^[a-zA-Z0-9_-]{12,128}$/.test(request.requestId ?? "")) throw new Error("FORGE_OPERATOR_REQUEST_ID_INVALID");
  }

  async manualPriceOptions(context) {
    if (!context?.authenticated || !context.operatorId) throw new Error("FORGE_OPERATOR_UNAUTHORIZED");
    return this.manualPriceEntryService.options();
  }

  async processManualPrice(context, request) {
    this._authorize(context, request);
    const requestDigest = hash({ action: ACTION, requestId: request.requestId, operatorId: context.operatorId, payload: request.payload });
    const prior = (await this.auditRepository.getAll()).find(record => record.requestId === request.requestId);
    if (prior) {
      if (prior.requestDigest !== requestDigest) throw new Error("FORGE_OPERATOR_REPLAY_CONFLICT");
      return Object.freeze({ status: "ALREADY_COMPLETED", auditId: prior.auditId, result: prior.result });
    }
    const result = await this.manualPriceEntryService.submit({ payload: request.payload, operatorId: context.operatorId });
    const audit = await this.auditRepository.record({ requestId: request.requestId, requestDigest, action: ACTION, operatorId: context.operatorId, occurredAt: this.now(), result });
    return Object.freeze({ status: "COMPLETED", auditId: audit.record.auditId, result });
  }
}
