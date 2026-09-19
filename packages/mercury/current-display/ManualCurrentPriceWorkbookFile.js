import { readFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const decodeXml = value => String(value ?? "").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,"&").replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code))).replace(/&#x([0-9a-f]+);/gi,(_,code)=>String.fromCodePoint(parseInt(code,16)));
const textContent = xml => [...String(xml).matchAll(/<(?:\w+:)?t(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?t>/g)].map(match=>decodeXml(match[1])).join("");
const columnIndex = reference => [...reference.replace(/\d/g,"")].reduce((value,character)=>value*26+character.charCodeAt(0)-64,0)-1;

function unzip(buffer) {
  let eocd=-1;
  for (let offset=buffer.length-22;offset>=Math.max(0,buffer.length-65557);offset--) if (buffer.readUInt32LE(offset)===0x06054b50) { eocd=offset; break; }
  if (eocd<0) throw new Error("MANUAL_CURRENT_PRICE_WORKBOOK_ZIP_INVALID");
  const entries=new Map(), count=buffer.readUInt16LE(eocd+10); let cursor=buffer.readUInt32LE(eocd+16);
  for (let index=0;index<count;index++) {
    if (buffer.readUInt32LE(cursor)!==0x02014b50) throw new Error("MANUAL_CURRENT_PRICE_WORKBOOK_ZIP_INVALID");
    const compression=buffer.readUInt16LE(cursor+10), compressedSize=buffer.readUInt32LE(cursor+20), nameLength=buffer.readUInt16LE(cursor+28), extraLength=buffer.readUInt16LE(cursor+30), commentLength=buffer.readUInt16LE(cursor+32), localOffset=buffer.readUInt32LE(cursor+42);
    const name=buffer.subarray(cursor+46,cursor+46+nameLength).toString("utf8").replace(/\\/g,"/");
    if (buffer.readUInt32LE(localOffset)!==0x04034b50) throw new Error("MANUAL_CURRENT_PRICE_WORKBOOK_ZIP_INVALID");
    const localNameLength=buffer.readUInt16LE(localOffset+26), localExtraLength=buffer.readUInt16LE(localOffset+28), start=localOffset+30+localNameLength+localExtraLength, compressed=buffer.subarray(start,start+compressedSize);
    if (compression===0) entries.set(name,Buffer.from(compressed));
    else if (compression===8) entries.set(name,inflateRawSync(compressed));
    else throw new Error("MANUAL_CURRENT_PRICE_WORKBOOK_COMPRESSION_UNSUPPORTED");
    cursor+=46+nameLength+extraLength+commentLength;
  }
  return entries;
}

const entryText = (entries,name,required=true) => {
  const value=entries.get(name);
  if (!value && required) throw new Error(`MANUAL_CURRENT_PRICE_WORKBOOK_ENTRY_MISSING:${name}`);
  return value?.toString("utf8") ?? "";
};

function sheetEntry(entries, sheetName) {
  const workbook=entryText(entries,"xl/workbook.xml"), relationships=entryText(entries,"xl/_rels/workbook.xml.rels");
  const sheet=[...workbook.matchAll(/<(?:\w+:)?sheet\b([^>]*)\/?\s*>/g)].map(match=>match[1]).find(attributes=>decodeXml(/\bname="([^"]+)"/.exec(attributes)?.[1])===sheetName);
  if (!sheet) throw new Error(`MANUAL_CURRENT_PRICE_WORKBOOK_SHEET_NOT_FOUND:${sheetName}`);
  const relationshipId=/\br:id="([^"]+)"/.exec(sheet)?.[1];
  const relationship=[...relationships.matchAll(/<Relationship\b([^>]*)\/?\s*>/g)].map(match=>match[1]).find(attributes=>/\bId="([^"]+)"/.exec(attributes)?.[1]===relationshipId);
  const target=/\bTarget="([^"]+)"/.exec(relationship ?? "")?.[1];
  if (!target) throw new Error("MANUAL_CURRENT_PRICE_WORKBOOK_SHEET_RELATIONSHIP_INVALID");
  return path.posix.normalize(target.startsWith("/") ? target.slice(1) : `xl/${target}`);
}

function worksheetRows(entries, sheetName) {
  const sharedXml=entryText(entries,"xl/sharedStrings.xml",false), shared=[...sharedXml.matchAll(/<(?:\w+:)?si(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?si>/g)].map(match=>textContent(match[1]));
  const worksheet=entryText(entries,sheetEntry(entries,sheetName)), rows=[];
  for (const rowMatch of worksheet.matchAll(/<(?:\w+:)?row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/(?:\w+:)?row>/g)) {
    const rowNumber=Number(rowMatch[1]), values=[];
    for (const cellMatch of rowMatch[2].matchAll(/<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)) {
      const attributes=cellMatch[1], body=cellMatch[2] ?? "", reference=/\br="([A-Z]+\d+)"/.exec(attributes)?.[1], type=/\bt="([^"]+)"/.exec(attributes)?.[1], raw=/<(?:\w+:)?v(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?v>/.exec(body)?.[1];
      if (!reference) continue;
      let value=null;
      if (type==="inlineStr") value=textContent(body);
      else if (raw!=null) {
        const decoded=decodeXml(raw);
        if (type==="s") value=shared[Number(decoded)] ?? null;
        else if (type==="str") value=decoded;
        else if (type==="b") value=decoded==="1";
        else value=decoded.trim()!=="" && Number.isFinite(Number(decoded)) ? Number(decoded) : decoded;
      }
      values[columnIndex(reference)]=value;
    }
    rows[rowNumber]=values;
  }
  return rows;
}

const requiredHeaders = Object.freeze(["Atlas Product ID","Newegg Destination ID","Newegg Ready for Import","Amazon Destination ID","Amazon Ready for Import","Rakuten Link Status"]);
const value = (record,header) => record.get(header) ?? null;
const observation = (record,prefix) => ({
  itemPriceUsd:value(record,`${prefix} Current Item Price`), currency:value(record,`${prefix} Currency`), availability:value(record,`${prefix} Availability`), observedDate:value(record,`${prefix} Observed Date`), observedTime:value(record,`${prefix} Observed Time`), timezone:value(record,`${prefix} Timezone`), observedAt:value(record,`${prefix} Observed At`), shipping:value(record,`${prefix} Shipping`), condition:value(record,`${prefix} Condition`), seller:value(record,`${prefix} Seller`), evidenceNotes:value(record,`${prefix} Evidence Notes`), reviewedBy:value(record,`${prefix} Reviewed By`), readyForImport:value(record,`${prefix} Ready for Import`)
});
const reference = (record,prefix,listingHeader) => ({ destinationId:value(record,`${prefix} Destination ID`), url:value(record,`${prefix} URL`), listingId:value(record,listingHeader), status:value(record,`${prefix} Destination Status`), legacyUrl:value(record,`${prefix} Legacy Research URL`) });

export function parseManualCurrentPriceWorkbook(buffer,{sheetName="Price Research"}={}) {
  const rows=worksheetRows(unzip(buffer),sheetName), headers=rows[4] ?? [];
  for (const header of requiredHeaders) if (!headers.includes(header)) throw new Error(`MANUAL_CURRENT_PRICE_WORKBOOK_HEADER_MISSING:${header}`);
  return rows.slice(5).filter(row=>row?.some(item=>item!=null&&item!=="")).map(row=>{
    const record=new Map(headers.map((header,index)=>[header,row[index] ?? null]));
    return {
      schemaVersion:"1.1", atlasProductId:value(record,"Atlas Product ID"), brand:value(record,"Brand"), productName:value(record,"Product Name"), manufacturerPartNumber:value(record,"MPN"), ddrGeneration:value(record,"DDR"), formFactor:value(record,"Form Factor"), totalCapacityGb:value(record,"Capacity GB"), moduleCount:value(record,"Module Count"), capacityPerModuleGb:value(record,"Capacity Per Module GB"), recordReviewedBy:value(record,"Record Reviewed By"),
      neweggReference:reference(record,"Newegg","Newegg Listing ID"), neweggObservation:observation(record,"Newegg"),
      amazonReference:reference(record,"Amazon","Amazon ASIN / Listing ID"), amazonObservation:observation(record,"Amazon"),
      rakutenRouting:{affiliateUrl:value(record,"Rakuten Newegg Affiliate Link"),status:value(record,"Rakuten Link Status"),checkedDate:value(record,"Rakuten Link Checked Date"),checkedTime:value(record,"Rakuten Link Checked Time"),timezone:value(record,"Rakuten Link Timezone"),checkedAt:value(record,"Rakuten Link Checked At"),notes:value(record,"Rakuten Link Notes")}
    };
  });
}

export async function readManualCurrentPriceWorkbookRows({workbookPath,sheetName="Price Research"}={}) {
  if (!workbookPath) throw new Error("MANUAL_CURRENT_PRICE_WORKBOOK_PATH_REQUIRED");
  return parseManualCurrentPriceWorkbook(await readFile(path.resolve(workbookPath)),{sheetName});
}

export async function readManualCurrentPriceWorkbookRow({workbookPath,atlasProductId,sheetName="Price Research"}={}) {
  if (!atlasProductId) throw new Error("MANUAL_CURRENT_PRICE_WORKBOOK_ATLAS_PRODUCT_REQUIRED");
  const matches=(await readManualCurrentPriceWorkbookRows({workbookPath,sheetName})).filter(row=>row.atlasProductId===atlasProductId);
  if (matches.length!==1) throw new Error(matches.length ? "MANUAL_CURRENT_PRICE_WORKBOOK_PRODUCT_DUPLICATE" : "MANUAL_CURRENT_PRICE_WORKBOOK_PRODUCT_NOT_FOUND");
  return matches[0];
}
