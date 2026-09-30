import { createRoot } from 'react-dom/client';
import { RouterPage } from './RouterPage';
import '../../src/UI/main.css';
import { logBuildInfo } from '../../src/Shared/buildInfo';
import { registerLogLevelSync } from '../../src/Shared/logStorage';

registerLogLevelSync();
logBuildInfo('router page');

const root = createRoot(document.getElementById('root')!);
root.render(<RouterPage />);
