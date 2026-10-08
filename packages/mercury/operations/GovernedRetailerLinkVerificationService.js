const STATUSES = Object.freeze(["WORKING", "REDIRECTED", "BROKEN", "BLOCKED_FROM_VERIFICATION", "IDENTITY_REVIEW_REQUIRED", "NOT_CHECKED"]);
const PRIVATE_HOST = /^(localhost|127\.|0\.0\.0\.0$|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$)/i;
const freeze = value => Object.freeze(value);

export class GovernedRetailerLinkVerificationService {
    constructor({ request, allowedHosts = ["amazon.com", "www.amazon.com", "newegg.com", "www.newegg.com", "click.linksynergy.com"], timeoutMs = 10_000, now = () => new Date().toISOString() } = {}) {
        if (typeof request !== "function") throw new TypeError("LINK_VERIFICATION_REQUEST_OWNER_REQUIRED");
        if (!Array.isArray(allowedHosts) || !allowedHosts.length || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000) throw new TypeError("LINK_VERIFICATION_POLICY_INVALID");
        this.request = request; this.allowedHosts = new Set(allowedHosts.map(value => value.toLowerCase())); this.timeoutMs = timeoutMs; this.now = now;
    }
    _url(value) {
        let url; try { url = new URL(value); } catch { throw new Error("LINK_VERIFICATION_URL_INVALID"); }
        if (url.protocol !== "https:" || url.username || url.password || PRIVATE_HOST.test(url.hostname) || !this.allowedHosts.has(url.hostname.toLowerCase())) throw new Error("LINK_VERIFICATION_TARGET_PROHIBITED");
        return url;
    }
    async verify({ url, expectedRetailerHost, expectedListingId } = {}) {
        const requested = this._url(url), controller = new AbortController(), timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await this.request(requested.href, { method: "HEAD", redirect: "follow", signal: controller.signal });
            const final = this._url(response.url || requested.href), status = Number(response.status);
            if ([401, 403, 429].includes(status)) return freeze({ status: "BLOCKED_FROM_VERIFICATION", checkedAt: this.now(), finalUrl: final.href, httpStatus: status, reasons: ["RETAILER_BLOCKED_AUTOMATED_VERIFICATION"] });
            if (status < 200 || status >= 400) return freeze({ status: "BROKEN", checkedAt: this.now(), finalUrl: final.href, httpStatus: status, reasons: ["HTTP_FAILURE"] });
            if (expectedRetailerHost && final.hostname.toLowerCase() !== expectedRetailerHost.toLowerCase()) return freeze({ status: "IDENTITY_REVIEW_REQUIRED", checkedAt: this.now(), finalUrl: final.href, httpStatus: status, reasons: ["RETAILER_DOMAIN_MISMATCH"] });
            if (expectedListingId && !decodeURIComponent(final.href).toUpperCase().includes(String(expectedListingId).toUpperCase())) return freeze({ status: "IDENTITY_REVIEW_REQUIRED", checkedAt: this.now(), finalUrl: final.href, httpStatus: status, reasons: ["PRODUCT_IDENTIFIER_NOT_CONFIRMED"] });
            return freeze({ status: final.href === requested.href ? "WORKING" : "REDIRECTED", checkedAt: this.now(), finalUrl: final.href, httpStatus: status, reasons: [] });
        } catch (error) {
            if (error?.name === "AbortError") return freeze({ status: "BLOCKED_FROM_VERIFICATION", checkedAt: this.now(), finalUrl: null, httpStatus: null, reasons: ["VERIFICATION_TIMEOUT"] });
            if (/PROHIBITED|INVALID/.test(String(error?.message))) throw error;
            return freeze({ status: "BLOCKED_FROM_VERIFICATION", checkedAt: this.now(), finalUrl: null, httpStatus: null, reasons: ["NETWORK_OR_RETAILER_BLOCK"] });
        } finally { clearTimeout(timer); }
    }
}

export { STATUSES as FORGE_LINK_VERIFICATION_STATUSES };
