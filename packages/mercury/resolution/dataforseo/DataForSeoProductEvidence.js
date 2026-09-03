function clean(value) { return typeof value === "string" && value.trim() ? value.trim() : null; }
function norm(value) { return clean(value)?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? null; }
function integer(value) { const m=String(value ?? "").match(/\b(\d+)\b/); return m ? Number(m[1]) : null; }
function capacityGb(value) { const m=String(value ?? "").match(/\b(\d+)\s*gb\b/i); return m ? Number(m[1]) : null; }
function dataRate(value) { const m=String(value ?? "").match(/\b(\d{4,5})\s*(?:mt\/?s|mhz)?\b/i); return m ? Number(m[1]) : null; }
function cas(value) { const m=String(value ?? "").match(/(?:\bcl\s*|cas(?: latency)?\s*[: ]\s*)(\d+)\b/i); return m ? Number(m[1]) : null; }
function partNumbers(value) { return String(value ?? "").split(/[,;|]/).map(v=>v.trim()).filter(Boolean); }

function specMap(item) {
  const map = new Map();
  for (const spec of item?.specifications ?? []) {
    const name=norm(spec?.specification_name); const value=clean(spec?.specification_value);
    if (name && value) map.set(name,value);
  }
  return map;
}
function first(map, names) { for (const name of names) { const v=map.get(name); if (v) return v; } return null; }
function titleText(item) { return [item?.title,item?.description,...(item?.features ?? [])].filter(Boolean).join(" "); }

export function createDataForSeoProductEvidence(item = {}) {
  const specs=specMap(item); const text=titleText(item);
  const pn=first(specs,["part numbers","part number","manufacturer part number","mpn","model number"]);
  const gtin=first(specs,["gtin","global trade item number"]);
  const upc=first(specs,["upc","universal product code"]);
  const capacity=first(specs,["memory size","memory capacity","capacity","ram"]);
  const modules=first(specs,["number of modules","module count","modules","kit size"]);
  const moduleCapacity=first(specs,["memory size per module","capacity per module","module capacity"]);
  const speed=first(specs,["memory speed","speed","data rate"]);
  const latency=first(specs,["cas latency","latency"]);
  const memoryType=first(specs,["memory type","memory technology","ram type","technology"]);
  const formFactor=first(specs,["form factor","memory form factor"]);
  const brand=first(specs,["brand","manufacturer"]);
  return Object.freeze({
    source: "DATAFORSEO_GOOGLE_SHOPPING",
    productId: clean(item?.product_id), gid: clean(item?.gid), title: clean(item?.title), description: clean(item?.description),
    manufacturerPartNumbers: Object.freeze(partNumbers(pn)), gtin: clean(gtin), upc: clean(upc), brand: clean(brand),
    capacityGb: capacityGb(capacity) ?? capacityGb(text), moduleCount: integer(modules), capacityPerModuleGb: capacityGb(moduleCapacity),
    memoryType: clean(memoryType) ?? (text.match(/\bDDR[345]\b/i)?.[0]?.toUpperCase() ?? null),
    dataRateMtps: dataRate(speed) ?? dataRate(text), casLatency: cas(latency) ?? cas(text), formFactor: clean(formFactor),
    rawSpecificationCount: specs.size
  });
}
