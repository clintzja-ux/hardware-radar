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
    const safe = new Error(text.startsWith("SFTP_") ? text : "SFTP_OPERATION_FAILED");
    safe.code = error?.code?.startsWith?.("SFTP_") ? error.code : "SFTP_OPERATION_FAILED";
    if (error?.stage) safe.diagnostic = Object.freeze({ stage:error.stage, exitCode:error.exitCode??null, signal:error.signal??null, processStarted:error.processStarted===true, streamsOpened:error.streamsOpened===true, askpassAttempted:error.askpassAttempted===true });
    return safe;
}

export function classifyOpenSshFailure(value) {
    const text = String(value ?? "");
    if (/permission denied|authentication failed|too many authentication failures/i.test(text)) return "SFTP_AUTH_FAILED";
    if (/host key verification failed|remote host identification has changed|offending .* key/i.test(text)) return "SFTP_HOST_VERIFICATION_FAILED";
    if (/connection timed out|operation timed out/i.test(text)) return "SFTP_CONNECT_TIMEOUT";
    if (/connection refused/i.test(text)) return "SFTP_CONNECT_REFUSED";
    if (/could not resolve hostname|name or service not known|no such host is known/i.test(text)) return "SFTP_DNS_FAILED";
    if (/subsystem request failed|subsystem .* failed|couldn't execute ssh_askpass|askpass.*(?:failed|error|not found|cannot)/i.test(text)) return "SFTP_SESSION_START_FAILED";
    return "SFTP_CONNECT_FAILED";
}

export function classifyOpenSshProcessFailure({ kind, stderr, exitCode, signal, askpassAttempted = false } = {}) {
    const classified = classifyOpenSshFailure(stderr);
    if (classified !== "SFTP_CONNECT_FAILED") return classified;
    if (kind === "SPAWN") return "SFTP_PROCESS_SPAWN_FAILED";
    if (kind === "TIMEOUT") return askpassAttempted ? "SFTP_HANDSHAKE_TIMEOUT" : "SFTP_ASKPASS_NOT_INVOKED";
    if (signal) return "SFTP_PROCESS_TERMINATED";
    if (Number.isInteger(exitCode) && exitCode !== 0) return askpassAttempted ? "SFTP_PROCESS_EXITED" : "SFTP_ASKPASS_NOT_INVOKED";
    if (kind === "EXIT") return "SFTP_SESSION_START_FAILED";
    return "SFTP_CONNECT_FAILED";
}
