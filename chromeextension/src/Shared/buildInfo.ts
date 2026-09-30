import { createLogger } from './logger';

// Build stamp injected by wxt.config.ts (vite `define`), logged at startup of
// every extension context so a console shows exactly which build is loaded.
declare const __BUILD_TIME__: string;
declare const __BUILD_COMMIT__: string;

export interface IBuildInfo {
  version: string;
  mode: string;
  builtAt: string;
  commit: string;
  apiBaseUrl: string;
}

export function getBuildInfo(): IBuildInfo {
  return {
    version: chrome.runtime.getManifest().version,
    mode: import.meta.env.MODE,
    builtAt: __BUILD_TIME__,
    commit: __BUILD_COMMIT__,
    apiBaseUrl: import.meta.env.WXT_API_BASE_URL,
  };
}

export function logBuildInfo(context: string): void {
  const info = getBuildInfo();
  createLogger('build').info(
    `${context} v${info.version}` +
      ` | mode ${info.mode}` +
      ` | built ${info.builtAt}` +
      ` | commit ${info.commit}` +
      ` | api ${info.apiBaseUrl}`,
  );
}
