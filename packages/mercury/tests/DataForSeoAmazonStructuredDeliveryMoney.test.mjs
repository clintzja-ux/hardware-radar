import assert from "node:assert/strict";
import { createAmazonSellersEvidence, normalizeAmazonSellersResultRows, projectAmazonSellerToRetainedEvidence } from "../index.js";

let cases=0;
const asin="B0ABC12345",price=(current=100,currency="USD")=>({current,regular:null,max_value:null,currency,is_price_range:false,displayed_price:`$${current}`}),delivery=(current,currency="USD",extra={})=>({current,regular:null,max_value:null,currency,is_price_range:false,displayed_price:`$${current}`,...extra});
const item=overrides=>({asin,seller_name:"Fixture Seller",seller_url:"https://amazon.com/sp",price:price(),condition:"New",delivery_info:{delivery_message:"fixture",delivery_price:null},...overrides});
const normalize=items=>normalizeAmazonSellersResultRows({sourceId:"DATAFORSEO_AMAZON",operation:"AMAZON_SELLERS",providerTaskId:"task",canonicalResultId:"result",resultDigest:"d".repeat(64),retrievedAt:"2026-09-16T00:00:00.000Z",operationResult:{result:[{asin,datetime:"2026-09-16T00:00:00.000Z",items}]}});

assert.equal(createAmazonSellersEvidence(item({delivery_info:null})).deliveryPrice,null);cases++;
assert.equal(createAmazonSellersEvidence({...item(),delivery_price:0}).deliveryPrice,0);cases++;
assert.equal(createAmazonSellersEvidence({...item(),delivery_price:5.5}).deliveryPrice,5.5);cases++;
assert.equal(createAmazonSellersEvidence(item({delivery_info:{delivery_price:delivery(10.04)}})).deliveryPrice,10.04);cases++;
assert.equal(createAmazonSellersEvidence(item({delivery_info:{delivery_price:delivery(0)}})).deliveryPrice,0);cases++;
assert.equal(createAmazonSellersEvidence(item({price:price(100,"EUR"),delivery_info:{delivery_price:delivery(5,"EUR")}})).deliveryPrice,5);cases++;
for(const [value,error] of [
 [delivery(5,"EUR"),/DELIVERY_CURRENCY_CONFLICT/],
 [{...delivery(5),currency:null},/DELIVERY_CURRENCY_REQUIRED/],
 [{...delivery(5),currency:42},/DELIVERY_CURRENCY_REQUIRED/],
 [{...delivery(5),current:undefined},/DELIVERY_MONEY_CURRENT_REQUIRED/],
 [{...delivery(5),current:null},/DELIVERY_MONEY_CURRENT_REQUIRED/],
 [delivery(-1),/MONEY_INVALID/],
 [delivery("5"),/MONEY_INVALID/],
 [{...delivery(5),is_price_range:true,max_value:10},/DELIVERY_MONEY_AMBIGUOUS/],
 [{...delivery(5),max_value:10},/DELIVERY_MONEY_AMBIGUOUS/],
 [{currency:"USD",is_price_range:false},/DELIVERY_MONEY_CURRENT_REQUIRED/]
]){assert.throws(()=>createAmazonSellersEvidence(item({delivery_info:{delivery_price:value}})),error);cases++;}

const mixed=normalize([item({seller_name:"Null Shipping"}),item({seller_name:"Known Shipping",delivery_info:{delivery_price:delivery(7.25)}})]);
assert.deepEqual(mixed.map(x=>x.sellerItem.deliveryPrice),[null,7.25]);cases++;
assert.deepEqual(mixed.map(x=>x.sellerItem.currentPrice),[100,100]);cases++;
const retained=projectAmazonSellerToRetainedEvidence(mixed[1].sellerItem,{atlasProductId:"ram_fixture",sourceTaskId:"task",observedAt:"2026-09-16T00:00:00.000Z",rawPayloadReference:"fixture:item:1"});
assert.equal(retained.pricing.basePrice,100);assert.equal(retained.pricing.shippingPrice,7.25);assert.equal(retained.pricing.tax,null);assert.equal("totalPrice" in retained.pricing,false);cases+=4;

const productionShapes=[
 {name:"Crucial",amount:486.96,shipping:10.04},
 {name:"CMK32",amount:799,shipping:4.99}
];
for(const shape of productionShapes){const [row]=normalize([item({seller_name:shape.name,price:price(shape.amount),delivery_info:{delivery_price:delivery(shape.shipping)}})]);assert.equal(row.sellerItem.currentPrice,shape.amount);assert.equal(row.sellerItem.deliveryPrice,shape.shipping);assert.equal(row.sellerItem.currency,"USD");cases+=3;}
const gskill=normalize([[198,5.83],[233.03,4.64],[374,36.74]].map(([amount,shipping],index)=>item({seller_name:`G.Skill ${index+1}`,price:price(amount),delivery_info:{delivery_price:delivery(shipping)}})));
assert.deepEqual(gskill.map(row=>row.sellerItem.deliveryPrice),[5.83,4.64,36.74]);cases++;
assert.deepEqual(gskill.map(row=>row.sellerItem.currentPrice),[198,233.03,374]);cases++;
const [sodimm]=normalize([item({seller_name:"Amazon.com",price:price(459.99),delivery_info:{delivery_price:null}})]);assert.equal(sodimm.sellerItem.currentPrice,459.99);assert.equal(sodimm.sellerItem.deliveryPrice,null);cases+=2;

console.log(`DataForSEO Amazon structured delivery-money tests passed: ${cases} cases.`);
