import { createRoot } from 'react-dom/client';
import { App } from './App';
import '../../src/UI/main.css';
import { logBuildInfo } from '../../src/Shared/buildInfo';
import { registerLogLevelSync } from '../../src/Shared/logStorage';

registerLogLevelSync();
logBuildInfo('options page');

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
