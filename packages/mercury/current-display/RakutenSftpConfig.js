const nonBlank = value => typeof value === "string" && value.trim() !== "";
const freeze = value => Object.freeze(value);

export function loadRakutenSftpConfig(env = process.env) {
    const host = nonBlank(env.RAKUTEN_SFTP_HOST) ? env.RAKUTEN_SFTP_HOST.trim().toLowerCase() : "aftp.linksynergy.com";
    const port = env.RAKUTEN_SFTP_PORT === undefined ? 22 : Number(env.RAKUTEN_SFTP_PORT);
    const username = nonBlank(env.RAKUTEN_SFTP_USERNAME) ? env.RAKUTEN_SFTP_USERNAME.trim() : null;
    const password = nonBlank(env.RAKUTEN_SFTP_PASSWORD) ? env.RAKUTEN_SFTP_PASSWORD : null;
    const concurrency = env.RAKUTEN_SFTP_CONNECTIONS === undefined ? 1 : Number(env.RAKUTEN_SFTP_CONNECTIONS);
    if (host !== "aftp.linksynergy.com" || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SFTP_CONFIG_INVALID");
    if (!username || !password) throw new Error("SFTP_CONFIG_MISSING");
    if (/[\r\n]/.test(username)) throw new Error("SFTP_CONFIG_INVALID");
    if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 5) throw new Error("SFTP_CONNECTION_LIMIT_INVALID");
    return freeze({ protocol: "SFTP", host, port, username, password, concurrency, toJSON: () => ({ protocol: "SFTP", host, port, username: "REDACTED", password: "REDACTED", concurrency }) });
}

export function redactRakutenSftpError(error, secrets = []) {
    let text = String(error?.message ?? error ?? "SFTP_OPERATION_FAILED");
    for (const secret of secrets.filter(nonBlank)) text = text.split(secret).join("REDACTED");
    text = text.replace(/(password|passphrase|authorization)\s*[=:]\s*[^\s]+/gi, "$1=REDACTED").replace(/sftp:\/\/[^\s@]+@/gi, "sftp://REDACTED@");
    const messageCode=/^SFTP_[A-Z0-9_]+$/.test(text)?text:null,explicitCode=/^SFTP_[A-Z0-9_]+$/.test(String(error?.code??""))?error.code:null,safeCode=explicitCode??messageCode??"SFTP_OPERATION_FAILED";
    const safe = new Error(safeCode);
    safe.code = safeCode;
    return safe;
}
