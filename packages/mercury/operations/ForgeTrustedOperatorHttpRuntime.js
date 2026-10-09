import crypto from "node:crypto";
const json=(response,status,value)=>{response.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});response.end(JSON.stringify(value));};
const cookies=request=>Object.fromEntries(String(request.headers.cookie??"").split(";").map(x=>x.trim().split("=")).filter(x=>x.length===2));
export class ForgeTrustedOperatorHttpRuntime{
 constructor({service,operatorId,allowedOrigin,trustedLaunch=false,now=()=>Date.now()}={}){if(!service||!operatorId||!allowedOrigin)throw new TypeError("FORGE_HTTP_RUNTIME_CONFIGURATION_REQUIRED");Object.assign(this,{service,operatorId,allowedOrigin,trustedLaunch,now});this.sessions=new Map();this.launchExpiresAt=now()+120000;this.launchClaimed=false;}
 establishTrustedLaunch(request,response){if(!this.trustedLaunch||this.launchClaimed||this.now()>this.launchExpiresAt||request.method!=="GET"||request.url!=="/"||request.headers["sec-fetch-site"]!=="none"||request.headers["sec-fetch-mode"]!=="navigate"||request.headers["sec-fetch-dest"]!=="document")return false;const id=crypto.randomBytes(32).toString("base64url"),csrf=crypto.randomBytes(24).toString("base64url");this.sessions.set(id,{csrf,createdAt:this.now()});this.launchClaimed=true;response.setHeader("Set-Cookie",`forge_session=${id}; HttpOnly; SameSite=Strict; Path=/`);return true;}
 async handle(request,response){
  const url=new URL(request.url,this.allowedOrigin);
  if(!url.pathname.startsWith("/operator-api/"))return false;
  const session=this.sessions.get(cookies(request).forge_session),sameOrigin=request.headers.origin===this.allowedOrigin||(request.method==="GET"&&String(request.headers.referer??"").startsWith(`${this.allowedOrigin}/`));
  if(!session||!sameOrigin)return json(response,401,{error:"FORGE_OPERATOR_UNAUTHORIZED"});
  if(request.method==="GET"&&url.pathname==="/operator-api/session")return json(response,200,{authenticated:true,operatorId:this.operatorId,csrf:session.csrf});
  if(request.headers["x-forge-csrf"]!==session.csrf)return json(response,401,{error:"FORGE_OPERATOR_UNAUTHORIZED"});
  if(request.method==="GET"&&url.pathname.startsWith("/operator-api/product/")){const id=decodeURIComponent(url.pathname.slice("/operator-api/product/".length)),product=await this.service.catalogRepository.getById(id);return product?json(response,200,product):json(response,404,{error:"ATLAS_PRODUCT_NOT_FOUND"});}
  if(request.method==="GET"&&url.pathname.startsWith("/operator-api/affiliate/")){const id=decodeURIComponent(url.pathname.slice("/operator-api/affiliate/".length));try{return json(response,200,await this.service.affiliateInspect({authenticated:true,operatorId:this.operatorId},id));}catch(error){return json(response,404,{error:error.message});}}
  if(request.method!=="POST")return json(response,405,{error:"METHOD_NOT_ALLOWED"});
  let body="";for await(const chunk of request){body+=chunk;if(body.length>1_000_000)return json(response,413,{error:"REQUEST_TOO_LARGE"});}let input;try{input=JSON.parse(body);}catch{return json(response,400,{error:"INVALID_JSON"});}
  const context={authenticated:true,operatorId:this.operatorId},routes={"/operator-api/brand/register":()=>this.service.registerBrand(context,input),"/operator-api/product/create":()=>this.service.createProduct(context,input),"/operator-api/product/edit":()=>this.service.editProduct(context,input),"/operator-api/destination":()=>this.service.destination(context,input),"/operator-api/affiliate":()=>this.service.affiliate(context,input),"/operator-api/link/verify":()=>this.service.verifyLink(context,input)};
  try{const operation=routes[url.pathname];if(!operation)return json(response,404,{error:"NOT_FOUND"});return json(response,200,await operation());}catch(error){return json(response,/UNAUTHORIZED|FORBIDDEN/.test(error.message)?403:409,{error:error.message});}
 }
}
