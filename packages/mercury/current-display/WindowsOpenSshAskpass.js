import { execFile } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const executeFile = promisify(execFile);
const SOURCE = `using System;
using System.IO;
internal static class HardwareRadarRakutenAskpass {
    public static int Main() {
        string marker = Environment.GetEnvironmentVariable("RAKUTEN_SFTP_ASKPASS_MARKER");
        if (!String.IsNullOrEmpty(marker)) { try { File.WriteAllText(marker, "INVOKED"); } catch { return 3; } }
        string value = Environment.GetEnvironmentVariable("RAKUTEN_SFTP_PASSWORD");
        if (String.IsNullOrEmpty(value)) return 2;
        Console.Out.Write(value);
        return 0;
    }
}
`;

export async function ensureWindowsOpenSshAskpass({ root, env = process.env, execute = executeFile } = {}) {
    if (process.platform !== "win32") throw new Error("SFTP_SESSION_START_FAILED");
    const directory = path.resolve(root), sourcePath = path.join(directory, "rakuten-sftp-askpass.cs"), executablePath = path.join(directory, "rakuten-sftp-askpass.exe");
    const systemRoot = env.SystemRoot ?? "C:\\Windows";
    const compiler = path.join(systemRoot, "Microsoft.NET", "Framework64", "v4.0.30319", "csc.exe");
    try { await access(compiler); } catch { throw new Error("SFTP_ASKPASS_COMPILER_MISSING"); }
    await mkdir(directory, { recursive: true });
    let current = null;
    try { current = await readFile(sourcePath, "utf8"); } catch {}
    let executableExists = true, executableValid = true;
    try { const bytes=await readFile(executablePath); executableValid=bytes.length>2&&bytes[0]===0x4d&&bytes[1]===0x5a; } catch { executableExists = false; }
    if (current !== SOURCE || !executableExists) {
        await writeFile(sourcePath, SOURCE, { encoding: "utf8", mode: 0o600 });
        try { await execute(compiler, ["/nologo", "/target:exe", `/out:${executablePath}`, sourcePath], { windowsHide: true }); }
        catch { throw new Error("SFTP_ASKPASS_BUILD_FAILED"); }
    }
    else if (!executableValid) throw new Error("SFTP_ASKPASS_HELPER_INVALID");
    return executablePath;
}
