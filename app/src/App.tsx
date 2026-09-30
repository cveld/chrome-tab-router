import { AuthSection } from './components/AuthSection';
import { ChromeInstanceSection } from './components/ChromeInstanceSection';
import { GroupcodeSection } from './components/GroupcodeSection';

const CHROME_WEB_STORE_URL =
  'https://chromewebstore.google.com/detail/chrome-tab-router/mdagoleaelpaicldokjcpelifdgmiglg';
const GITHUB_URL = 'https://github.com/cveld/chrome-tab-router';

export function App() {
  return (
    <main className="container">
      <h1>Chrome Tab Router</h1>
      <p className="intro">
        Chrome Tab Router is a Chrome extension that routes incoming links to your preferred Chrome
        user profile. Install it from the{' '}
        <a href={CHROME_WEB_STORE_URL} target="_blank" rel="noopener noreferrer">
          Chrome Web Store
        </a>
        ; the source code is on{' '}
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        .
      </p>
      <ChromeInstanceSection />
      <AuthSection />
      <GroupcodeSection />
    </main>
  );
}
