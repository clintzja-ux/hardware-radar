$ErrorActionPreference='Stop'
function Read-EphemeralSecret([string]$Prompt){$secure=Read-Host -Prompt $Prompt -AsSecureString;$pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure);try{return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)}}
Write-Host 'GET-only Cloudflare recipient verification observation. No provider mutation is authorized.'
Write-Host 'THE API TOKEN MUST NOT BE SHARED IN CHAT.'
try{$env:CLOUDFLARE_ACCOUNT_ID=Read-EphemeralSecret 'Cloudflare account ID (hidden)';$env:CLOUDFLARE_API_TOKEN=Read-EphemeralSecret 'Cloudflare API token (hidden)';$env:BEACON_ALERT_RECIPIENT=Read-EphemeralSecret 'Approved recipient (hidden)';& node scripts/beacon-gateway-alert-recipient-verification-observe.mjs;if($LASTEXITCODE-ne 0){throw 'Observation failed.'}}finally{Remove-Item Env:CLOUDFLARE_ACCOUNT_ID -ErrorAction SilentlyContinue;Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue;Remove-Item Env:BEACON_ALERT_RECIPIENT -ErrorAction SilentlyContinue}
Write-Host 'STOP: candidate observation only. Evidence admission remains separate.'
