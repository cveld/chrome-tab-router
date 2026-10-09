// Mock Chrome toolbar icon and options page window for the dev-only pages
// (badge-preview, groupcode-scenario). Renders the real banner component.
import type { ReactNode } from 'react';
import type { IBadgeStatus } from '../../src/Shared/BadgeStatusModels';
import {
  BadgeStatusBannerView,
  useJustConnected,
  type BadgeTarget,
} from '../options/components/BadgeStatusBannerView';
import { apiBaseUrl } from '../../src/Background/settings';

/** Mirrors what applyBadge() in badgeStatusHandler.ts puts on the real icon. */
export function tooltip(status: IBadgeStatus): string {
  return status.problem ? `${status.title} (click for details)` : status.title;
}

export function MockIcon({ status, onClick }: { status: IBadgeStatus; onClick?: () => void }) {
  return (
    <button type="button" className="mock-icon" title={tooltip(status)} onClick={onClick}>
      <img src="/icon.png" alt="" />
      {status.problem && <span className="mock-badge">!</span>}
    </button>
  );
}

const OPTION_TABS = ['Welcome', 'Groupcode', 'Connection', 'User profiles', 'Rules', 'Log', 'Settings'];
const TARGET_TAB: Record<BadgeTarget, string> = { connection: 'Connection' };

export function MockOptionsPage({
  status,
  activeTab,
  onTab,
  children,
}: {
  status: IBadgeStatus;
  activeTab: string;
  onTab: (tab: string) => void;
  children?: ReactNode;
}) {
  const justConnected = useJustConnected(status);
  return (
    <div className="mock-window">
      <div className="mock-window-bar">chrome-extension://…/options.html</div>
      <nav className="tabbar">
        {OPTION_TABS.map(tab => (
          <button
            type="button"
            key={tab}
            className={`tabbar-item${tab === activeTab ? ' active' : ''}`}
            onClick={() => onTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
      <BadgeStatusBannerView
        status={status}
        justConnected={justConnected}
        endpoint={`${apiBaseUrl}/api`}
        onNavigate={target => onTab(TARGET_TAB[target])}
      />
      <div className="mock-tab-content">{children}</div>
    </div>
  );
}
