import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";

const freeze=value=>Object.freeze(structuredClone(value));
const base64url=value=>Buffer.from(JSON.stringify(value)).toString("base64url");
const required=(value,code)=>{if(typeof value!=="string"||!value.trim())throw new Error(code);return value.trim();};

export class GitHubAppInstallationTokenProvider {
  constructor({appId,installationId,privateKeyPath,repositoryOwner,repositoryName,fetchImpl=globalThis.fetch,readPrivateKey=path=>readFile(path,"utf8"),now=()=>new Date()}={}) { Object.assign(this,{appId,installationId,privateKeyPath,repositoryOwner,repositoryName,fetchImpl,readPrivateKey,now}); }
  async getToken() {
    const appId=required(this.appId,"PUBLICATION_GITHUB_APP_ID_REQUIRED"),installationId=required(this.installationId,"PUBLICATION_GITHUB_INSTALLATION_ID_REQUIRED"),privateKeyPath=required(this.privateKeyPath,"PUBLICATION_GITHUB_PRIVATE_KEY_PATH_REQUIRED"),repositoryOwner=required(this.repositoryOwner,"PUBLICATION_GITHUB_REPOSITORY_OWNER_REQUIRED"),repositoryName=required(this.repositoryName,"PUBLICATION_GITHUB_REPOSITORY_NAME_REQUIRED");
    let privateKey;try{privateKey=await this.readPrivateKey(privateKeyPath);}catch{throw new Error("PUBLICATION_GITHUB_PRIVATE_KEY_INVALID");}
    const issued=Math.floor(this.now().getTime()/1000),header=base64url({alg:"RS256",typ:"JWT"}),payload=base64url({iat:issued-60,exp:issued+540,iss:appId}),unsigned=`${header}.${payload}`;
    let signature;try{const signer=createSign("RSA-SHA256");signer.update(unsigned);signer.end();signature=signer.sign(privateKey).toString("base64url");}catch{throw new Error("PUBLICATION_GITHUB_PRIVATE_KEY_INVALID");}
    const response=await this.fetchImpl(`https://api.github.com/app/installations/${encodeURIComponent(installationId)}/access_tokens`,{method:"POST",headers:{Accept:"application/vnd.github+json",Authorization:`Bearer ${unsigned}.${signature}`,"X-GitHub-Api-Version":"2022-11-28","User-Agent":"hardware-radar-publication"},body:JSON.stringify({repositories:[repositoryName],permissions:{contents:"write"}})});
    if(!response?.ok)throw new Error(`PUBLICATION_GITHUB_APP_TOKEN_REQUEST_FAILED:${response?.status??"UNKNOWN"}`);
    const value=await response.json(),expiresAt=Date.parse(value.expires_at),repository=value.repositories?.find(item=>item.name===repositoryName&&item.owner?.login===repositoryOwner);
    if(!value.token||!Number.isFinite(expiresAt)||expiresAt-this.now().getTime()<60_000||value.permissions?.contents!=="write"||!repository)throw new Error("PUBLICATION_GITHUB_APP_TOKEN_SCOPE_INVALID");
    return freeze({token:value.token,expiresAt:value.expires_at,repository:`${repositoryOwner}/${repositoryName}`,permissions:{contents:"write"}});
  }
}

export function createGitHubAppInstallationTokenProviderFromEnvironment({environment=process.env,...overrides}={}) { return new GitHubAppInstallationTokenProvider({appId:environment.HARDWARE_RADAR_PUBLICATION_GITHUB_APP_ID,installationId:environment.HARDWARE_RADAR_PUBLICATION_GITHUB_APP_INSTALLATION_ID,privateKeyPath:environment.HARDWARE_RADAR_PUBLICATION_GITHUB_APP_PRIVATE_KEY_PATH,repositoryOwner:environment.HARDWARE_RADAR_PUBLICATION_GITHUB_REPOSITORY_OWNER,repositoryName:environment.HARDWARE_RADAR_PUBLICATION_GITHUB_REPOSITORY_NAME,...overrides}); }
