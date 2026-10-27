import path from "node:path";

export function resolveNpmRunInvocation({ script, platform = process.platform, nodeExecutable = process.execPath, npmEntryPoint = process.env.npm_execpath } = {}) {
  if (typeof script !== "string" || !/^[a-z0-9][a-z0-9:_-]*$/i.test(script)) throw new Error("NPM_SCRIPT_NAME_INVALID");
  if (platform !== "win32") return Object.freeze({ command: "npm", args: Object.freeze(["run", script]) });
  if (typeof nodeExecutable !== "string" || !path.isAbsolute(nodeExecutable)) throw new Error("NODE_EXECUTABLE_INVALID");
  if (typeof npmEntryPoint !== "string" || !path.isAbsolute(npmEntryPoint) || !/\.m?js$/i.test(npmEntryPoint)) throw new Error("NPM_ENTRY_POINT_UNAVAILABLE");
  return Object.freeze({ command: nodeExecutable, args: Object.freeze([npmEntryPoint, "run", script]) });
}

export function createPortableNpmRunner({ execFile, cwd, baseOptions = {}, platform = process.platform, nodeExecutable = process.execPath, npmEntryPoint = process.env.npm_execpath } = {}) {
  if (typeof execFile !== "function") throw new Error("EXEC_FILE_REQUIRED");
  return async function runNpmScript(script, options = {}) {
    const invocation = resolveNpmRunInvocation({ script, platform, nodeExecutable, npmEntryPoint });
    const { args: scriptArgs = [], ...execOptions } = options;
    if (!Array.isArray(scriptArgs) || scriptArgs.some(value => typeof value !== "string")) throw new Error("NPM_SCRIPT_ARGUMENTS_INVALID");
    return execFile(invocation.command, [...invocation.args, ...(scriptArgs.length ? ["--", ...scriptArgs] : [])], { cwd, ...baseOptions, ...execOptions });
  };
}
