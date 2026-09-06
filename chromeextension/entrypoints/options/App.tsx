import { useState } from 'react';
import { ConnectionTab } from './components/ConnectionTab';
import { GroupcodeTab } from './components/GroupcodeTab';
import { LogTab } from './components/LogTab';
import { RulesTab } from './components/RulesTab';
import { SettingsTab } from './components/SettingsTab';
import { UserProfilesTab } from './components/UserProfilesTab';
import { WelcomeTab } from './components/WelcomeTab';

const TABS = [
  { key: 'welcome', label: 'Welcome', render: () => <WelcomeTab /> },
  { key: 'groupcode', label: 'Groupcode', render: () => <GroupcodeTab /> },
  { key: 'connection', label: 'Connection', render: () => <ConnectionTab /> },
  { key: 'userprofiles', label: 'User profiles', render: () => <UserProfilesTab /> },
  { key: 'rules', label: 'Rules', render: () => <RulesTab /> },
  { key: 'log', label: 'Log', render: () => <LogTab /> },
  { key: 'settings', label: 'Settings', render: () => <SettingsTab /> },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function App() {
  const [activeKey, setActiveKey] = useState<TabKey>('welcome');
  const active = TABS.find(tab => tab.key === activeKey)!;

  return (
    <>
      <nav className="tabbar">
        {TABS.map(tab => (
          <button
            type="button"
            key={tab.key}
            className={`tabbar-item${tab.key === activeKey ? ' active' : ''}`}
            onClick={() => setActiveKey(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <main className="content">{active.render()}</main>
    </>
  );
}
