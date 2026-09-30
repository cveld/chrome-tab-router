import { backgroundConnectionStore } from '../backgroundStores';
import { useStore } from '../stores';

/**
 * Shown while the page cannot reach the background service worker. The port
 * keeps retrying on its own; the hint covers a worker that never starts
 * (seen after a fresh Chrome Web Store install), which only a toggle fixes.
 */
export function BackgroundConnectionBanner() {
  const { connected, error } = useStore(backgroundConnectionStore);

  if (connected || !error) {
    return null;
  }

  return (
    <div className="banner banner-error" role="alert">
      <b>The extension background is not reachable.</b> Retrying automatically. If this persists,
      turn Chrome Tab Router off and on again at chrome://extensions.
      <div className="banner-detail">{error}</div>
    </div>
  );
}
