// WXT/Vite env vars, defined in .env (dev), .env.azure (dev against the
// deployed backend) and .env.production (build). Must be prefixed WXT_ to
// be exposed at runtime — see https://wxt.dev/guide/essentials/config/environment-variables.html
export const apiBaseUrl = import.meta.env.WXT_API_BASE_URL;
export const configUrl = import.meta.env.WXT_CONFIG_URL;
