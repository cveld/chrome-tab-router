import { useEffect, useState, type ReactNode } from 'react';
import { getBuildInfo } from '../../src/Shared/buildInfo';
import { BackgroundConnectionBanner } from '../../src/UI/components/BackgroundConnectionBanner';
import { BadgeStatusBanner } from './components/BadgeStatusBanner';
import { ConnectionTab } from './components/ConnectionTab';
import { LogTab } from './components/LogTab';
import { RulesTab } from './components/RulesTab';
import { SettingsTab } from './components/SettingsTab';
import { UserProfilesTab } from './components/UserProfilesTab';
import { WelcomeTab } from './components/WelcomeTab';
import { hashForTab, tabFromHash, type TabKey } from './lib/tabs';

function buildStamp(): string {
  const info = getBuildInfo();
  return `Chrome Tab Router v${info.version} · ${info.mode} · built ${info.builtAt} · commit ${info.commit}`;
}

const TABS: Array<{ key: TabKey; label: string; render: (navigate: (tab: TabKey) => void) => ReactNode }> = [
  { key: 'welcome', label: 'Welcome', render: navigate => <WelcomeTab onNavigate={navigate} /> },
  { key: 'connection', label: 'Connection', render: () => <ConnectionTab /> },
  { key: 'userprofiles', label: 'User profiles', render: () => <UserProfilesTab /> },
  { key: 'rules', label: 'Rules', render: () => <RulesTab /> },
  { key: 'log', label: 'Log', render: () => <LogTab /> },
  { key: 'settings', label: 'Settings', render: () => <SettingsTab /> },
];

/** The active tab lives in the url hash, so a tab can be linked to, reloaded and reached with Back. */
function useHashTab(): [TabKey, (tab: TabKey) => void] {
  const [tab, setTab] = useState<TabKey>(() => tabFromHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const select = (next: TabKey) => {
    if (window.location.hash === hashForTab(next)) {
      setTab(next);
    } else {
      // Fires hashchange, which updates the state.
      window.location.hash = hashForTab(next);
    }
  };
  return [tab, select];
}

export function App() {
  const [activeKey, selectTab] = useHashTab();
  const active = TABS.find(tab => tab.key === activeKey)!;

  return (
    <>
      <nav className="tabbar">
        {TABS.map(tab => (
          <button
            type="button"
            key={tab.key}
            className={`tabbar-item${tab.key === activeKey ? ' active' : ''}`}
            onClick={() => selectTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <BackgroundConnectionBanner />
      <BadgeStatusBanner onNavigate={selectTab} />
      <main className="content">{active.render(selectTab)}</main>
      <footer className="build-footer">{buildStamp()}</footer>
    </>
  );
}
