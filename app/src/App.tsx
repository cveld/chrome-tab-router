import { AuthSection } from './components/AuthSection';
import { ChromeInstanceSection } from './components/ChromeInstanceSection';
import { GroupcodeSection } from './components/GroupcodeSection';

export function App() {
  return (
    <main className="container">
      <h1>Chrome Tab Router</h1>
      <ChromeInstanceSection />
      <AuthSection />
      <GroupcodeSection />
    </main>
  );
}
