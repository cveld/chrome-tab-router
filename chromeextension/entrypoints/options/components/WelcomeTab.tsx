import { configUrl } from '../../../src/Background/settings';
import { setSyncBackend } from '../../../src/UI/backgroundStores';
import type { TabKey } from '../lib/tabs';

export function openGroupcodeApp() {
  void chrome.tabs.create({ url: configUrl });
}

export function WelcomeTab({ onNavigate }: { onNavigate: (tab: TabKey) => void }) {
  return (
    <section className="narrow">
      <h1>Chrome Tab Router</h1>
      <p>
        This extension enables you to define the preferred Chrome user profile where you would
        like to open your website.
      </p>
      <p>
        To route links between your user profiles, the profiles have to be able to talk to each
        other. You choose how, per profile. All profiles that should work together must use the
        same option.
      </p>
      <p>
        Source code:{' '}
        <a href="https://github.com/cveld/chrome-tab-router" target="_blank" rel="noreferrer">
          github.com/cveld/chrome-tab-router
        </a>
      </p>

      <h2>Cloud</h2>
      <p>
        An external web service relays the messages. Convenient, works across machines and needs
        no installation. A <b>groupcode</b> connects your user profiles; the next tab walks you
        through generating one or entering an existing one.
      </p>
      <div className="row">
        <button
          type="button"
          className="btn secondary"
          onClick={() => {
            setSyncBackend('cloud');
            onNavigate('connection');
          }}
        >
          Set up cloud sync
        </button>
      </div>

      <h2>Local relay</h2>
      <p>
        A small program on this machine relays the messages. Nothing leaves your computer and you
        need no account, but it only connects profiles on this machine and the relay has to be
        running. It uses a <b>pairing code</b> instead of a groupcode.
      </p>
      <div className="row">
        <button
          type="button"
          className="btn secondary"
          onClick={() => {
            setSyncBackend('local');
            onNavigate('connection');
          }}
        >
          Set up the local relay
        </button>
      </div>

      <h2>Privacy policy</h2>
      <p>
        Chrome Tab Router only processes what it needs to route tabs between your Chrome
        profiles: the URLs of tabs it evaluates, the routing rules and profile names you
        configure, and your groupcode or pairing code. With the cloud option this data is relayed
        through an Azure-hosted backend (SignalR + Azure Functions) purely to pass messages
        between your own profiles in real time — the backend does not store your browsing
        history, and no data is shared with third parties. Generating a groupcode requires signing
        in to the web app; the identity details that sign-in supplies (such as your sign-in name)
        are contained in the groupcode, so treat it as private. With the local relay option the
        data only travels between processes on your own machine and no sign-in is needed.
      </p>
      <p>
        The groupcode is a shared secret: only extension instances configured with the same
        groupcode can exchange messages, and only your own profiles are meant to share one.
      </p>
      <p>
        No analytics, tracking, or advertising identifiers are collected. All configuration
        (rules, profile names, groupcode) is stored locally via <code>chrome.storage.local</code>{' '}
        and synced only between your own connected profiles.
      </p>
      <p>
        <a href={`${configUrl}/privacy.html`} target="_blank" rel="noreferrer">
          Full privacy policy
        </a>
      </p>
    </section>
  );
}
