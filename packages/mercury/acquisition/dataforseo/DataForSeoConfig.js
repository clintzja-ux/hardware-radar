export const DATAFORSEO_SOURCE_ID = "DATAFORSEO_GOOGLE_SHOPPING";
export const DATAFORSEO_API_BASE_URL = "https://api.dataforseo.com";
export const DATAFORSEO_SANDBOX_BASE_URL = "https://sandbox.dataforseo.com";
export const DATAFORSEO_DEFAULT_LOCATION = "United States";
export const DATAFORSEO_DEFAULT_LANGUAGE = "English";
export const DATAFORSEO_NORMAL_PRIORITY = 1;

export function loadDataForSeoCredentials(env = process.env) {
  const login = env.DATAFORSEO_LOGIN?.trim();
  const password = env.DATAFORSEO_PASSWORD?.trim();
  if (!login || !password) throw new Error("DATAFORSEO_CREDENTIALS_MISSING");
  return Object.freeze({ login, password });
}
