import { chromeInstanceIdStore } from '../stores/chromeInstanceIdStore';
import { backgroundErrorStore, contentScriptReadyStore } from '../messaging/documentEventing';
import { useStore } from '../lib/stores';

/** Shows whether the Chrome Tab Router extension was detected on this page. */
export function ChromeInstanceSection() {
  const extensionFound = useStore(contentScriptReadyStore);
  const chromeInstanceId = useStore(chromeInstanceIdStore);
  const backgroundError = useStore(backgroundErrorStore);

  if (!extensionFound) {
    return (
      <section className="card">
        <i>
          Chrome tab router extension not found. Please go to the Chrome extension gallery and
          install it.
        </i>
      </section>
    );
  }

  return (
    <section className="card">
      <p>
        ChromeInstanceId = {chromeInstanceId}
        <br />
        ContentScriptReady = true
        <br />
        <b>Chrome tab router extension found</b>
      </p>
      {backgroundError && (
        <p className="error-text">
          The extension is installed but its background is not responding ({backgroundError}).
          Turn Chrome Tab Router off and on again at chrome://extensions, then reload this page.
        </p>
      )}
    </section>
  );
}
