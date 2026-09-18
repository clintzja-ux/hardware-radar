import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadStaticPublicationRelease } from "./static-publication-release-runtime.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = Object.fromEntries(process.argv.slice(2).filter(value => value.startsWith("--") && value.includes("=")).map(value => value.slice(2).split(/=(.*)/s).slice(0, 2)));
const manifestPath = path.resolve(args.manifest ?? path.join(root, "config", "publication-release.json"));
const targetEnvironment = (args.environment ?? process.env.HARDWARE_RADAR_PUBLIC_RELEASE_ENVIRONMENT ?? "PREVIEW").toUpperCase();
const evaluatedAt = args["evaluated-at"] ?? process.env.HARDWARE_RADAR_GENERATED_AT ?? new Date().toISOString();
const result = await loadStaticPublicationRelease({ manifestPath, targetEnvironment, evaluatedAt });
console.log(JSON.stringify({ manifestPath, evaluatedAt, ...result, projection: undefined }, null, 2));
