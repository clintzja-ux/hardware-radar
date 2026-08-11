export class AmazonTokenProvider {
  constructor({ credentialVersion, fetchToken, now = () => Date.now(), skewMs = 60_000 } = {}) {
    if (!credentialVersion || typeof fetchToken !== "function") throw new TypeError("credentialVersion and fetchToken are required.");
    this.credentialVersion = credentialVersion; this.fetchToken = fetchToken; this.now = now; this.skewMs = skewMs; this.cached = null;
  }
  async getAccessToken() {
    if (this.cached && this.now() < this.cached.expiresAt - this.skewMs) return this.cached.token;
    const result = await this.fetchToken({ credentialVersion: this.credentialVersion });
    if (!result?.accessToken || !Number.isFinite(result.expiresInSeconds)) throw new Error("Invalid Amazon token response.");
    this.cached = { token: result.accessToken, expiresAt: this.now() + result.expiresInSeconds * 1000 };
    return this.cached.token;
  }
  invalidate() { this.cached = null; }
}
export default AmazonTokenProvider;
