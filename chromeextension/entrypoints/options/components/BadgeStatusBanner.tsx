import { badgeStatusStore } from '../../../src/UI/backgroundStores';
import { useStore } from '../../../src/UI/stores';
import { apiBaseUrl } from '../../../src/Background/settings';
import { BadgeStatusBannerView, useJustConnected, type BadgeTarget } from './BadgeStatusBannerView';

/** Explains the red "!" on the extension icon; clicking the icon opens this page. */
export function BadgeStatusBanner({ onNavigate }: { onNavigate: (target: BadgeTarget) => void }) {
  const status = useStore(badgeStatusStore);
  const justConnected = useJustConnected(status);
  return <BadgeStatusBannerView status={status} justConnected={justConnected} endpoint={apiBaseUrl} onNavigate={onNavigate} />;
}
