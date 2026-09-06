import { configUrl } from '../../../src/Background/settings';

export function openGroupcodeApp() {
  void chrome.tabs.create({ url: configUrl });
}

export function WelcomeTab() {
  return (
    <section className="narrow">
      <h1>Chrome Tab Router</h1>
      <p>
        This extension enables you to define the preferred Chrome user profile where you would
        like to open your website.
      </p>
      <p>
        The extension connects with an external webservice that provides the communication between
        the various user profiles you have running.
      </p>
      <p>
        Source code:{' '}
        <a href="https://github.com/cveld/chrome-tab-router" target="_blank" rel="noreferrer">
          github.com/cveld/chrome-tab-router
        </a>
      </p>
      <h2>Groupcode</h2>
      <p>
        In order to connect user profiles together a <b>groupcode</b> is required.
      </p>
      <p>For the very first user profile you are setting up you will need to generate a groupcode.</p>
      <p>For subsequent user profiles you will copy over the generated groupcode yourself.</p>
      <p>In this way the user profiles get connected.</p>
      <button type="button" className="btn primary" onClick={openGroupcodeApp}>
        Generate
      </button>
      <h2>Privacy policy</h2>
      <p>
        Chrome Tab Router only processes what it needs to route tabs between your Chrome
        profiles: the URLs of tabs it evaluates, the routing rules and profile names you
        configure, and your groupcode. This data is relayed through an Azure-hosted backend
        (SignalR + Azure Functions) purely to pass messages between your own profiles in real
        time — the backend does not store your browsing history, and no data is shared with
        third parties.
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
