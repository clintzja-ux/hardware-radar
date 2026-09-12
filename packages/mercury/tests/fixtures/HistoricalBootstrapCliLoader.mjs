export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith("/packages/mercury/index.js") || specifier.endsWith("\\packages\\mercury\\index.js")) {
    return { url: new URL("./HistoricalBootstrapCliService.mjs", import.meta.url).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
