import { useEffect, useMemo, useRef, useState } from 'react';
import type { IRule } from '../../src/Shared/RuleModels';
import type { IUserProfileStatus } from '../../src/Shared/UserprofileModels';
import { ConnectionStatusEnum } from '../../src/Shared/signalrModels';
import { findMatchingRule, suggestRegexForUrl } from '../../src/Shared/ruleMatching';
import { RuleDialog } from '../../src/UI/components/RuleDialog';
import { UserProfileDialog } from '../../src/UI/components/UserProfileDialog';
import {
  addRule,
  changeRule,
  chromeInstanceIdStore,
  connectionStatusStore,
  openTabHere,
  routeTab,
  rulesStore,
  settingsStore,
  updateUserProfile,
  userProfilesStore,
} from '../../src/UI/backgroundStores';
import { useStore } from '../../src/UI/stores';

export function RouterPage() {
  const targetUrl = useMemo(() => new URLSearchParams(window.location.search).get('url') ?? '', []);

  const rules = useStore(rulesStore);
  const userProfiles = useStore(userProfilesStore);
  const ownInstanceId = useStore(chromeInstanceIdStore);
  const settings = useStore(settingsStore);
  const connectionStatus = useStore(connectionStatusStore);

  const [tabId, setTabId] = useState<number | undefined>(undefined);
  const [cancelled, setCancelled] = useState(false);
  const [dialog, setDialog] = useState<'add' | 'edit' | null>(null);
  const [renaming, setRenaming] = useState<IUserProfileStatus | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [handedOver, setHandedOver] = useState<string | null>(null);
  // The tab disappears once the target profile confirms, so every path must
  // act at most once — a second routetab would open a duplicate tab there.
  const decided = useRef(false);

  const match = useMemo(() => findMatchingRule(rules, targetUrl), [rules, targetUrl]);
  const connected = connectionStatus.status === ConnectionStatusEnum.connected;
  const profiles = userProfiles.filter(profile => !profile.deleted);
  const armed =
    !!match?.targetUserprofile && !cancelled && dialog === null && connected && tabId !== undefined;

  function profileName(chromeInstanceId: string | undefined) {
    const profile = profiles.find(candidate => candidate.chromeInstanceId === chromeInstanceId);
    return profile?.name || chromeInstanceId || 'unknown profile';
  }

  function hand(targetUserprofile: string) {
    if (decided.current || tabId === undefined) {
      return;
    }
    decided.current = true;
    setCancelled(true);
    if (targetUserprofile === ownInstanceId) {
      openTabHere({ url: targetUrl, tabId });
      return;
    }
    setHandedOver(profileName(targetUserprofile));
    routeTab({ url: targetUrl, tabId, targetUserprofile });
  }

  useEffect(() => {
    chrome.tabs.getCurrent().then(tab => setTabId(tab?.id));
  }, []);

  useEffect(() => {
    if (!armed) {
      setRemaining(null);
      return;
    }
    setRemaining(settings.countdownSeconds);
    const timer = setInterval(() => {
      setRemaining(previous => (previous === null || previous <= 1 ? 0 : previous - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [armed, settings.countdownSeconds, match?.id, match?.targetUserprofile]);

  useEffect(() => {
    if (remaining !== 0 || !armed || decided.current) {
      return;
    }
    hand(match!.targetUserprofile!);
  }, [remaining, armed]);

  function submitRule(patch: Pick<IRule, 'regex' | 'targetUserprofile'>) {
    if (dialog === 'edit' && match) {
      changeRule(match, patch);
    } else {
      addRule(patch);
    }
    setDialog(null);
    setCancelled(false);
  }

  if (!targetUrl) {
    return (
      <main className="content narrow">
        <h1>Chrome Tab Router</h1>
        <p>No url to route.</p>
      </main>
    );
  }

  return (
    <main className="content narrow">
      <h1>Chrome Tab Router</h1>
      <p className="router-url">{targetUrl}</p>

      <div className="router-decision">
        {match ? (
          <>
            <span className="status-badge routing">Rule match</span>
            <p>
              Belongs to <strong>{profileName(match.targetUserprofile)}</strong> — matched by{' '}
              <code>{String(match.regex)}</code>
            </p>
          </>
        ) : (
          <>
            <span className="status-badge unmatched">No matching rule</span>
            <p>This url stays in the current profile unless you pick a target below.</p>
          </>
        )}
        {armed && remaining !== null && (
          <p className="row">
            <span>
              Routing in <span className="router-countdown">{remaining}</span> s
            </span>
            <button type="button" className="btn secondary" onClick={() => setCancelled(true)}>
              Cancel
            </button>
          </p>
        )}
        {handedOver && <p>Handed over to {handedOver}; this tab closes automatically.</p>}
      </div>

      {!connected && (
        <p className="error-text">
          Not connected — routing to another profile is unavailable until the extension reconnects.
        </p>
      )}

      <h2>Open in</h2>
      <div className="row router-choices">
        {profiles.map((profile: IUserProfileStatus) => {
          const own = profile.chromeInstanceId === ownInstanceId;
          return (
            <span className="row router-choice" key={profile.chromeInstanceId}>
              <button
                type="button"
                className={`btn ${own ? 'primary' : 'secondary'}`}
                disabled={tabId === undefined || (!own && !connected)}
                onClick={() => hand(profile.chromeInstanceId!)}
              >
                {profile.name || profile.chromeInstanceId}
                {own ? ' (this profile)' : ''}
              </button>
              <button
                type="button"
                className="icon-button rename"
                aria-label={`Rename ${profile.name || profile.chromeInstanceId}`}
                title="Rename profile"
                onClick={() => setRenaming(profile)}
              >
                ✎
              </button>
            </span>
          );
        })}
        {profiles.length === 0 && <i>No user profiles registered yet.</i>}
      </div>

      <h2>Rules</h2>
      <div className="row">
        <button type="button" className="btn secondary" onClick={() => setDialog('add')}>
          Add rule for this URL…
        </button>
        {match && (
          <button type="button" className="btn secondary" onClick={() => setDialog('edit')}>
            Edit matching rule…
          </button>
        )}
      </div>

      {dialog && (
        <RuleDialog
          title={dialog === 'add' ? 'Add rule for this URL' : 'Edit matching rule'}
          submitLabel={dialog === 'add' ? 'Add' : 'Change'}
          initialRule={
            dialog === 'add'
              ? { regex: suggestRegexForUrl(targetUrl), targetUserprofile: match?.targetUserprofile }
              : match
          }
          onSubmit={submitRule}
          onClose={() => setDialog(null)}
        />
      )}

      {renaming && (
        <UserProfileDialog
          profile={renaming}
          isCurrent={renaming.chromeInstanceId === ownInstanceId}
          onClose={() => setRenaming(null)}
          onChange={updated => {
            updateUserProfile(updated);
            setRenaming(null);
          }}
        />
      )}
    </main>
  );
}
