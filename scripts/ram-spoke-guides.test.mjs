import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const definitions = [
    { file:"ddr4-vs-ddr5.md", route:"/guides/ram/ddr4-vs-ddr5/", title:"DDR4 vs DDR5: Which Should You Buy?", ctas:["/ddr5.html","/ddr4.html"] },
    { file:"16gb-vs-32gb.md", route:"/guides/ram/16gb-vs-32gb/", title:"16GB vs 32GB RAM: How Much Do You Actually Need?", ctas:["/ddr5.html","/ddr4.html","/sodimm.html"] },
    { file:"check-ram-compatibility.md", route:"/guides/ram/check-ram-compatibility/", title:"How to Check What RAM Is Compatible With Your PC", ctas:["/sodimm.html","/ddr4.html","/ddr5.html"] },
    { file:"ram-speed-cas-latency.md", route:"/guides/ram/ram-speed-cas-latency/", title:"RAM Speed and CAS Latency Explained", ctas:["/ddr5.html","/ddr4.html"] }
];
const outputs=[]; const titles=new Set(); const descriptions=new Set();
for (const item of definitions) {
    const source=await readFile(path.join(root,"content","guides",item.file),"utf8");
    const output=await readFile(path.join(root,"public",...item.route.slice(1).split("/"),"index.html"),"utf8");
    outputs.push(output);
    assert.match(source,new RegExp(`^canonicalPath: "${item.route.replaceAll("/","\\/")}"$`,"m"));
    assert.match(source,/^articleType: "GUIDE"$/m);
    assert.match(source,/^publishedAt: "2026-09-02"$/m);
    assert.match(source,/^updatedAt: "2026-09-02"$/m);
    const description=source.match(/^description: "(.+)"$/m)?.[1];
    assert.ok(description && !descriptions.has(description)); descriptions.add(description);
    assert.ok(!titles.has(item.title)); titles.add(item.title);
    const body=source.replace(/^---[\s\S]*?---\s*/,"");
    const words=body.match(/[A-Za-z0-9]+(?:['’.-][A-Za-z0-9]+)*/g)??[];
    assert.ok(words.length>=1100 && words.length<=2500,`${item.file} word-count sanity failed: ${words.length}`);
    assert.equal((output.match(/<h1>/g)??[]).length,1);
    assert.match(output,new RegExp(`<h1>${item.title.replace(/[?]/g,"\\?")}<\\/h1>`));
    assert.match(output,new RegExp(`<link rel="canonical" href="https:\\/\\/cheapestram\\.com${item.route.replaceAll("/","\\/")}">`));
    assert.match(output,/"@type":"Article"/);
    assert.match(output,/"@type":"BreadcrumbList"/);
    assert.match(output,/Home[\s\S]*Guides[\s\S]*RAM/);
    assert.match(output,/href="\/guides\/ram\/"/);
    assert.match(output,/<h2 id=/);
    assert.match(output,/article-references/);
    for (const route of item.ctas) assert.match(output,new RegExp(`href="${route.replace(".","\\.")}"`));
    assert.doesNotMatch(body,/\b(?:Best RAM|Best DDR5 RAM|Best RAM for Gaming|Best Value RAM|Top RAM Kits|GOVERNED PICK)\b/i);
    assert.doesNotMatch(body,/\b(?:in our testing|we benchmarked|our lab|reviewed in hand|measured directly)\b/i);
    assert.doesNotMatch(body,/\b(?:Amazon|Newegg|Adorama|MemoryC|Platinummicro)\b/i);
    assert.doesNotMatch(body,/\$\s*\d|<(?:script|iframe|object|embed|style|link|meta)\b|javascript:/i);
}

const hub=await readFile(path.join(root,"public","guides","ram","index.html"),"utf8");
for (const item of definitions) assert.match(hub,new RegExp(`href="${item.route.replaceAll("/","\\/")}"`));
assert.match(outputs[0],/href="\/guides\/ram\/check-ram-compatibility\/"/);
assert.match(outputs[0],/href="\/guides\/ram\/ram-speed-cas-latency\/"/);
assert.match(outputs[1],/href="\/guides\/ram\/check-ram-compatibility\/"/);
assert.match(outputs[2],/href="\/guides\/ram\/ddr4-vs-ddr5\/"/);
assert.match(outputs[3],/href="\/guides\/ram\/ddr4-vs-ddr5\/"/);
assert.match(outputs[3],/\(30 × 2000\) \/ 6000 = 10ns/);
assert.match(outputs[3],/\(40 × 2000\) \/ 5600 ≈ 14\.29ns/);

const sitemap=await readFile(path.join(root,"public","sitemap.xml"),"utf8");
const editorial=[...sitemap.matchAll(/<loc>https:\/\/cheapestram\.com(\/guides[^<]*)<\/loc>/g)].map(x=>x[1]);
assert.deepEqual(editorial,["/guides/","/guides/ram/","/guides/ram/16gb-vs-32gb/","/guides/ram/check-ram-compatibility/","/guides/ram/ddr4-vs-ddr5/","/guides/ram/ram-speed-cas-latency/"]);
assert.equal(new Set(editorial).size,6);
for (const item of definitions) await access(path.join(root,"public",...item.route.slice(1).split("/"),"index.html"));

const [index,homepage,ddr5]=await Promise.all([
    readFile(path.join(root,"public","guides","index.html"),"utf8"),
    readFile(path.join(root,"public","index.html"),"utf8"),
    readFile(path.join(root,"public","ddr5.html"),"utf8")
]);
assert.match(index,/RAM guides/); assert.match(index,/href="\/guides\/ram\/"/);
assert.match(homepage,/<h1>Compare RAM Prices<\/h1>/);
assert.match(ddr5,/<h1>Compare DDR5 RAM Prices<\/h1>/);

console.log("CONTENT-005 four-spoke RAM cluster contract passed.");
