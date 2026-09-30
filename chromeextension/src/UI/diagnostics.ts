import { formatDiagnosticsReport } from '../Shared/DiagnosticsModels';
import { getBuildInfo } from '../Shared/buildInfo';
import { getLogEntries } from '../Shared/logger';
import { backgroundConnectionStore, requestBackgroundDiagnostics } from './backgroundStores';

export interface ICopyDiagnosticsResult {
  /** False when the service worker did not answer and only page state was copied. */
  backgroundIncluded: boolean;
}

/** Builds the diagnostics report and puts it on the clipboard. */
export async function copyDiagnostics(context: string): Promise<ICopyDiagnosticsResult> {
  const background = await requestBackgroundDiagnostics();
  const connection = backgroundConnectionStore.get();
  const report = formatDiagnosticsReport(
    {
      context,
      build: getBuildInfo(),
      userAgent: navigator.userAgent,
      backgroundConnected: connection.connected,
      backgroundError: connection.error,
      log: getLogEntries(),
    },
    background,
  );
  await navigator.clipboard.writeText(report);
  return { backgroundIncluded: !!background };
}
